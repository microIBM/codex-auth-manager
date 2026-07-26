import {
  Agent,
  fetch as undiciFetch,
  type Dispatcher,
  type RequestInit as UndiciRequestInit,
} from "undici";
import {abortableDelay, throwIfAborted} from "../utils.js";
import type {
  SmsActivation,
  SmsProvider,
  SmsVerificationCode,
  SmsWaitForCodeOptions,
} from "./provider.js";

const GRIZZLY_SMS_DEFAULT_BASE_URL = "https://api.grizzlysms.com/stubs/handler_api.php";
const GRIZZLY_SMS_DEFAULT_POLL_ATTEMPTS = 24;
const GRIZZLY_SMS_DEFAULT_POLL_INTERVAL_MS = 5000;
const GRIZZLY_SMS_CODE_PATTERN = /(?<!\d)(\d{4,8})(?!\d)/;

type GrizzlySmsFetchResponse = Pick<Response, "ok" | "status" | "text">;
type GrizzlySmsFetch = (
  input: string | URL,
  init?: UndiciRequestInit,
) => Promise<GrizzlySmsFetchResponse>;

export type GrizzlySmsActivationStatusCode = 1 | 3 | 6 | 8;

export interface GrizzlySmsProviderConfig {
  apiKey: string;
  baseUrl?: string;
  providerName?: string;
  pollAttempts?: number;
  pollIntervalMs?: number;
  defaultRequestOptions?: GrizzlySmsNumberRequestOptions;
  defaultWaitForCodeOptions?: GrizzlySmsWaitForCodeOptions;
  fetchImpl?: GrizzlySmsFetch;
}

export interface GrizzlySmsNumberRequestOptions {
  service: string;
  country?: number | string;
  maxPrice?: number;
  providerIds?: string | string[];
  exceptProviderIds?: string | string[];
}

export interface GrizzlySmsActivation extends SmsActivation {
  activationId: string;
  phoneNumber: string;
  canRequestAnotherSms: boolean;
}

export interface GrizzlySmsVerificationCode extends SmsVerificationCode {
  code: string;
  source: "status";
  text?: string;
  rawStatus: string;
}

export interface GrizzlySmsWaitForCodeOptions extends SmsWaitForCodeOptions {
  markReady?: boolean;
  completeOnCode?: boolean;
}

export interface GrizzlySmsProvider extends SmsProvider<
  GrizzlySmsActivation,
  GrizzlySmsVerificationCode
> {
  requestActivation(): Promise<GrizzlySmsActivation>;
  requestPhoneNumber(options: GrizzlySmsNumberRequestOptions): Promise<GrizzlySmsActivation>;
  markActivationReady(activationId: string | number): Promise<string>;
  requestAnotherSms(activationId: string | number): Promise<string>;
  completeActivation(activationId: string | number): Promise<string>;
  cancelAndWithdraw(activationId: string | number): Promise<string>;
  cancelActivation(activationId: string | number): Promise<string>;
  getActivationStatus(
    activationId: string | number,
    options?: {abortSignal?: AbortSignal},
  ): Promise<string>;
  waitForVerificationCode(
    activationId: string | number,
    options?: GrizzlySmsWaitForCodeOptions,
  ): Promise<GrizzlySmsVerificationCode>;
}

export class GrizzlySmsApiError extends Error {
  readonly action: string;
  readonly httpStatus?: number;
  readonly payload: unknown;

  constructor(action: string, message: string, options: {httpStatus?: number; payload?: unknown} = {}) {
    super(message);
    this.name = "GrizzlySmsApiError";
    this.action = action;
    this.httpStatus = options.httpStatus;
    this.payload = options.payload;
  }
}

function getProviderName(config: GrizzlySmsProviderConfig): string {
  return String(config.providerName ?? "GrizzlySMS").trim() || "GrizzlySMS";
}

function ensureApiKeyConfigured(config: GrizzlySmsProviderConfig): string {
  const apiKey = String(config.apiKey ?? "").trim();
  if (!apiKey) {
    throw new Error(`${getProviderName(config)} apiKey 未配置`);
  }
  return apiKey;
}

function ensureDefaultRequestOptionsConfigured(config: GrizzlySmsProviderConfig): GrizzlySmsNumberRequestOptions {
  if (!config.defaultRequestOptions) {
    throw new Error(`${getProviderName(config)} defaultRequestOptions 未配置，无法通过通用 SmsProvider 接口申请 activation`);
  }
  return config.defaultRequestOptions;
}

function normalizeBaseUrl(config: GrizzlySmsProviderConfig): string {
  const baseUrl = String(config.baseUrl ?? GRIZZLY_SMS_DEFAULT_BASE_URL).trim();
  if (!baseUrl) {
    throw new Error(`${getProviderName(config)} baseUrl 未配置`);
  }
  return baseUrl;
}

function buildDispatcher(): Dispatcher {
  return new Agent({
    connect: {rejectUnauthorized: false},
  });
}

function createDefaultFetch(): GrizzlySmsFetch {
  return async (input, init = {}) => undiciFetch(input, {
    ...init,
    dispatcher: buildDispatcher(),
  } satisfies UndiciRequestInit) as Promise<GrizzlySmsFetchResponse>;
}

function setOptionalQuery(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value == null) {
    return;
  }
  const normalized = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).join(",")
    : String(value).trim();
  if (!normalized) {
    return;
  }
  searchParams.set(key, normalized);
}

function formatPayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function isFailureString(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith("ACCESS_") || normalized.startsWith("STATUS_")) {
    return false;
  }
  return (
    normalized.startsWith("BAD_") ||
    normalized.startsWith("NO_") ||
    normalized.startsWith("WRONG_") ||
    normalized.startsWith("ERROR_") ||
    normalized.startsWith("BANNED") ||
    normalized === "SERVICE_UNAVAILABLE_REGION" ||
    normalized === "CHANNELS_LIMIT" ||
    normalized === "OPERATORS_NOT_FOUND" ||
    normalized === "EARLY_CANCEL_DENIED"
  );
}

function createApiError(
  config: GrizzlySmsProviderConfig,
  action: string,
  payload: unknown,
  httpStatus?: number,
): GrizzlySmsApiError {
  return new GrizzlySmsApiError(
    action,
    `${getProviderName(config)} ${action} 请求失败: ${formatPayload(payload)}`,
    {httpStatus, payload},
  );
}

async function requestGrizzlySmsApi(
  config: GrizzlySmsProviderConfig,
  action: string,
  query: Record<string, unknown> = {},
  options: {abortSignal?: AbortSignal} = {},
): Promise<string> {
  throwIfAborted(options.abortSignal);
  const url = new URL(normalizeBaseUrl(config));
  url.searchParams.set("api_key", ensureApiKeyConfigured(config));
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(query)) {
    setOptionalQuery(url.searchParams, key, value);
  }

  const response = await (config.fetchImpl ?? createDefaultFetch())(url, {
    method: "GET",
    signal: options.abortSignal,
    headers: {
      Accept: "text/plain, application/json;q=0.9, */*;q=0.8",
    },
  });
  throwIfAborted(options.abortSignal);
  const payload = (await response.text()).trim();
  if (!response.ok) {
    throw createApiError(config, action, payload, response.status);
  }
  if (isFailureString(payload)) {
    throw createApiError(config, action, payload, response.status);
  }
  return payload;
}

function ensureServiceConfigured(options: GrizzlySmsNumberRequestOptions): string {
  const service = String(options.service ?? "").trim();
  if (!service) {
    throw new Error("短信服务 service 未配置");
  }
  return service;
}

function normalizeActivationId(activationId: string | number): string {
  const normalized = String(activationId ?? "").trim();
  if (!normalized) {
    throw new Error("短信服务 activationId 不能为空");
  }
  return normalized;
}

function normalizeActivation(config: GrizzlySmsProviderConfig, payload: string): GrizzlySmsActivation {
  const parts = payload.split(":");
  if (parts.length < 3 || parts[0] !== "ACCESS_NUMBER") {
    throw new Error(`${getProviderName(config)} getNumber 返回格式异常: ${formatPayload(payload)}`);
  }
  const activationId = parts[1]?.trim() ?? "";
  const phoneNumber = parts.slice(2).join(":").trim();
  if (!activationId || !phoneNumber) {
    throw new Error(`${getProviderName(config)} getNumber 返回缺少 activationId 或 phoneNumber: ${formatPayload(payload)}`);
  }
  return {
    activationId,
    phoneNumber,
    canRequestAnotherSms: true,
  };
}

function extractCodeFromText(text?: string): string | undefined {
  const normalized = String(text ?? "").trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.match(GRIZZLY_SMS_CODE_PATTERN)?.[1];
}

function extractCodeFromStatus(status: string): GrizzlySmsVerificationCode | null {
  if (!status.startsWith("STATUS_OK:")) {
    return null;
  }
  const text = status.slice("STATUS_OK:".length).trim();
  const code = extractCodeFromText(text) ?? text;
  if (!code) {
    return null;
  }
  return {
    code,
    source: "status",
    text,
    rawStatus: status,
  };
}

function resolvePollAttempts(config: GrizzlySmsProviderConfig, options?: GrizzlySmsWaitForCodeOptions): number {
  const attempts = options?.pollAttempts ?? config.pollAttempts ?? GRIZZLY_SMS_DEFAULT_POLL_ATTEMPTS;
  return attempts > 0 ? Math.floor(attempts) : GRIZZLY_SMS_DEFAULT_POLL_ATTEMPTS;
}

function resolvePollIntervalMs(config: GrizzlySmsProviderConfig, options?: GrizzlySmsWaitForCodeOptions): number {
  const intervalMs = options?.pollIntervalMs ?? config.pollIntervalMs ?? GRIZZLY_SMS_DEFAULT_POLL_INTERVAL_MS;
  return intervalMs > 0 ? Math.floor(intervalMs) : GRIZZLY_SMS_DEFAULT_POLL_INTERVAL_MS;
}

export function createGrizzlySmsProvider(config: GrizzlySmsProviderConfig): GrizzlySmsProvider {
  ensureApiKeyConfigured(config);

  const provider: GrizzlySmsProvider = {
    async requestActivation(): Promise<GrizzlySmsActivation> {
      return provider.requestPhoneNumber(ensureDefaultRequestOptionsConfigured(config));
    },

    async requestPhoneNumber(options: GrizzlySmsNumberRequestOptions): Promise<GrizzlySmsActivation> {
      const payload = await requestGrizzlySmsApi(config, "getNumber", {
        service: ensureServiceConfigured(options),
        country: options.country ?? "any",
        maxPrice: options.maxPrice,
        providerIds: options.providerIds,
        exceptProviderIds: options.exceptProviderIds,
      });
      return normalizeActivation(config, payload);
    },

    async markActivationReady(activationId: string | number): Promise<string> {
      return requestGrizzlySmsApi(config, "setStatus", {
        id: normalizeActivationId(activationId),
        status: 1 satisfies GrizzlySmsActivationStatusCode,
      });
    },

    async requestAnotherSms(activationId: string | number): Promise<string> {
      return requestGrizzlySmsApi(config, "setStatus", {
        id: normalizeActivationId(activationId),
        status: 3 satisfies GrizzlySmsActivationStatusCode,
      });
    },

    async completeActivation(activationId: string | number): Promise<string> {
      return requestGrizzlySmsApi(config, "setStatus", {
        id: normalizeActivationId(activationId),
        status: 6 satisfies GrizzlySmsActivationStatusCode,
      });
    },

    async cancelAndWithdraw(activationId: string | number): Promise<string> {
      return provider.cancelActivation(activationId);
    },

    async cancelActivation(activationId: string | number): Promise<string> {
      return requestGrizzlySmsApi(config, "setStatus", {
        id: normalizeActivationId(activationId),
        status: 8 satisfies GrizzlySmsActivationStatusCode,
      });
    },

    async getActivationStatus(
      activationId: string | number,
      requestOptions: {abortSignal?: AbortSignal} = {},
    ): Promise<string> {
      return requestGrizzlySmsApi(config, "getStatus", {
        id: normalizeActivationId(activationId),
      }, requestOptions);
    },

    async waitForVerificationCode(
      activationId: string | number,
      options: GrizzlySmsWaitForCodeOptions = {},
    ): Promise<GrizzlySmsVerificationCode> {
      const normalizedActivationId = normalizeActivationId(activationId);
      const waitOptions = {
        ...config.defaultWaitForCodeOptions,
        ...options,
      };
      const pollAttempts = resolvePollAttempts(config, waitOptions);
      const pollIntervalMs = resolvePollIntervalMs(config, waitOptions);
      let lastStatus = "";

      throwIfAborted(waitOptions.abortSignal);
      if (waitOptions.markReady) {
        await provider.markActivationReady(normalizedActivationId);
        throwIfAborted(waitOptions.abortSignal);
      }

      for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
        throwIfAborted(waitOptions.abortSignal);
        console.log(`[pollSMSCode]: ${getProviderName(config)} attempt:${attempt}/${pollAttempts}`);
        const status = await provider.getActivationStatus(normalizedActivationId, {
          abortSignal: waitOptions.abortSignal,
        });
        throwIfAborted(waitOptions.abortSignal);
        lastStatus = status;
        const verification = extractCodeFromStatus(status);
        if (verification) {
          if (waitOptions.completeOnCode) {
            await provider.completeActivation(normalizedActivationId);
          }
          return verification;
        }

        if (status === "STATUS_CANCEL") {
          throw new Error(`${getProviderName(config)} 激活已取消: activationId=${normalizedActivationId}`);
        }

        if (attempt < pollAttempts) {
          await abortableDelay(pollIntervalMs, waitOptions.abortSignal);
        }
      }

      throw new Error(
        `${getProviderName(config)} 长时间未收到验证码: activationId=${normalizedActivationId} lastStatus=${formatPayload(lastStatus)}`,
      );
    },
  };

  return provider;
}
