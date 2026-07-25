import {Agent, fetch as undiciFetch, type RequestInit as UndiciRequestInit} from "undici";
import {appConfig} from "../core/config.js";

const GRIZZLY_SMS_DEFAULT_BASE_URL = "https://api.grizzlysms.com/stubs/handler_api.php";

export interface HandlerApiSmsServiceConfig {
  providerName: string;
  baseUrl: string;
  getApiKey: () => string | undefined;
}

export interface GrizzlySmsCountryItem {
  countryId: number;
  countryName: string;
  countryNameEn: string;
  countryNameRu: string;
  phoneCode: string;
  visible: boolean | null;
  retry: boolean | null;
  rent: boolean | null;
  multiService: boolean | null;
}

export interface GrizzlySmsPriceItem {
  countryId: number;
  countryName: string;
  phoneCode: string;
  service: string;
  price: number | null;
  currency: string;
  available: number | null;
  providerId?: number | null;
}

export interface GrizzlySmsBalance {
  balance: number | null;
  currency: string;
  raw: string;
}

const GRIZZLY_SMS_SERVICE_CONFIG: HandlerApiSmsServiceConfig = {
  providerName: "GrizzlySMS",
  baseUrl: GRIZZLY_SMS_DEFAULT_BASE_URL,
  getApiKey: () => appConfig.grizzlySMSApiKey,
};

function buildDispatcher() {
  return new Agent({
    connect: {rejectUnauthorized: false},
  });
}

async function requestHandlerApiSms(
  config: HandlerApiSmsServiceConfig,
  action: string,
  query: Record<string, unknown> = {},
): Promise<unknown> {
  const apiKey = String(config.getApiKey() ?? "").trim();
  if (!apiKey) {
    throw new Error(`${config.providerName} API Key 未配置`);
  }
  const url = new URL(config.baseUrl);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  const response = await undiciFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    },
    dispatcher: buildDispatcher(),
  } satisfies UndiciRequestInit);
  const text = (await response.text()).trim();
  const payload = parsePayload(text);
  if (!response.ok) {
    throw new Error(`${config.providerName} ${action} HTTP ${response.status}: ${formatPayload(payload)}`);
  }
  if (typeof payload === "string" && /^(BAD_|NO_|ERROR_|WRONG_|BANNED|SERVICE_UNAVAILABLE_REGION)/i.test(payload)) {
    throw new Error(`${config.providerName} ${action}: ${payload}`);
  }
  return payload;
}

function parsePayload(text: string): unknown {
  if (!text) {
    return "";
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

function asArray(payload: unknown, primitiveKey = "value"): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["data", "countries", "items", "list"]) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
    return Object.entries(record).map(([key, value]) => {
      if (value && typeof value === "object") {
        return {country: key, ...(value as Record<string, unknown>)};
      }
      return {country: key, [primitiveKey]: value};
    });
  }
  return [];
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (value != null && typeof value === "object") {
      continue;
    }
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null || value === "") {
      continue;
    }
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
}

function firstBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (value == null || value === "") {
      continue;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    const text = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(text)) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].includes(text)) {
      return false;
    }
  }
  return null;
}

export async function getGrizzlySmsCountries(): Promise<{countries: GrizzlySmsCountryItem[]; error?: string}> {
  return getHandlerApiSmsCountries(GRIZZLY_SMS_SERVICE_CONFIG);
}

export async function getHandlerApiSmsCountries(
  config: HandlerApiSmsServiceConfig,
): Promise<{countries: GrizzlySmsCountryItem[]; error?: string}> {
  try {
    const payload = await requestHandlerApiSms(config, "getCountries");
    const countries = asArray(payload, "name")
      .map((item) => {
        const record = item as Record<string, unknown>;
        const countryId = firstNumber(record.id, record.country, record.countryId, record.country_id);
        if (countryId == null) {
          return null;
        }
        const countryName = firstString(
          record.chn,
          record.zh,
          record.name,
          record.title,
          record.countryName,
          record.country_name,
          record.eng,
          record.en,
          record.rus,
          record.ru,
          record.value,
        );
        return {
          countryId,
          countryName: countryName || `国家 ID: ${countryId}`,
          countryNameEn: firstString(record.eng, record.en),
          countryNameRu: firstString(record.rus, record.ru),
          phoneCode: firstString(record.phoneCode, record.phone_code, record.prefix, record.code),
          visible: firstBoolean(record.visible),
          retry: firstBoolean(record.retry),
          rent: firstBoolean(record.rent),
          multiService: firstBoolean(record.multiService, record.multi_service),
        };
      })
      .filter((item): item is GrizzlySmsCountryItem => item !== null)
      .sort((left, right) => left.countryId - right.countryId);
    return {countries};
  } catch (error) {
    return {countries: [], error: error instanceof Error ? error.message : String(error)};
  }
}

export async function getGrizzlySmsBalance(): Promise<{balance: GrizzlySmsBalance | null; error?: string}> {
  return getHandlerApiSmsBalance(GRIZZLY_SMS_SERVICE_CONFIG);
}

export async function getHandlerApiSmsBalance(
  config: HandlerApiSmsServiceConfig,
): Promise<{balance: GrizzlySmsBalance | null; error?: string}> {
  try {
    const payload = await requestHandlerApiSms(config, "getBalance");
    return {balance: normalizeBalance(payload)};
  } catch (error) {
    return {balance: null, error: error instanceof Error ? error.message : String(error)};
  }
}

export async function getGrizzlySmsPrices(country: number, service = "dr"): Promise<{prices: GrizzlySmsPriceItem[]; error?: string}> {
  return getHandlerApiSmsPrices(GRIZZLY_SMS_SERVICE_CONFIG, country, service);
}

export async function getHandlerApiSmsPrices(
  config: HandlerApiSmsServiceConfig,
  country: number,
  service = "dr",
): Promise<{prices: GrizzlySmsPriceItem[]; error?: string}> {
  let fallbackError = "";
  for (const action of ["getPricesV3", "getPricesV2", "getPrices"]) {
    try {
      const payload = await requestHandlerApiSms(config, action, {country, service});
      const prices = normalizeHandlerApiSmsPrices(payload, country, service);
      if (prices.length > 0 || action === "getPrices") {
        return {prices};
      }
      fallbackError = `${config.providerName} ${action}: no prices`;
    } catch (error) {
      fallbackError = error instanceof Error ? error.message : String(error);
    }
  }
  return {prices: [], error: fallbackError};
}

function normalizeBalance(payload: unknown): GrizzlySmsBalance {
  if (typeof payload === "string") {
    const raw = payload.trim();
    const matched = raw.match(/ACCESS_BALANCE:([+-]?\d+(?:\.\d+)?)/i);
    return {
      balance: matched ? Number(matched[1]) : firstNumber(raw),
      currency: "",
      raw,
    };
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    return {
      balance: firstNumber(record.balance, record.amount, record.value, record.money),
      currency: firstString(record.currency, record.currencyName),
      raw: formatPayload(payload),
    };
  }
  return {
    balance: firstNumber(payload),
    currency: "",
    raw: formatPayload(payload),
  };
}

export function normalizeHandlerApiSmsPrices(payload: unknown, country: number, service: string): GrizzlySmsPriceItem[] {
  try {
    const prices = normalizePrices(payload, country, service);
    return prices.sort((left, right) =>
      (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY)
      || (right.available ?? 0) - (left.available ?? 0)
      || (left.providerId ?? 0) - (right.providerId ?? 0),
    );
  } catch (error) {
    return [];
  }
}

function normalizePrices(payload: unknown, country: number, service: string): GrizzlySmsPriceItem[] {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const countryPayload = record[String(country)];
    if (countryPayload && countryPayload !== payload) {
      return normalizePrices(countryPayload, country, service);
    }
    const servicePayload = record[service] ?? record[service.toLowerCase()] ?? record[service.toUpperCase()];
    if (servicePayload && servicePayload !== payload) {
      return normalizePrices(servicePayload, country, service);
    }
    const directPrice = firstNumber(record.price, record.cost, record.activationCost, record.value);
    const directAvailable = firstNumber(record.count, record.available, record.quantity, record.physicalCount);
    if (directPrice != null || directAvailable != null) {
      return [{
        countryId: firstNumber(record.country, record.countryId, record.country_id, country) ?? country,
        countryName: firstString(record.countryName, record.country_name, record.name),
        phoneCode: firstString(record.phoneCode, record.phone_code, record.prefix),
        service: firstString(record.service, service),
        price: directPrice,
        currency: firstString(record.currency, record.currencyName),
        available: directAvailable,
        providerId: firstNumber(record.providerId, record.provider_id),
      }];
    }
    const providerRows = normalizeProviderPriceRows(record, country, service);
    if (providerRows.length > 0) {
      return providerRows;
    }
    const tierRows = normalizePriceTierRows(record, country, service);
    if (tierRows.length > 0) {
      return tierRows;
    }
  }
  const items = asArray(payload, "price");
  return items.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      countryId: firstNumber(record.country, record.countryId, record.country_id, country) ?? country,
      countryName: firstString(record.countryName, record.country_name, record.name),
      phoneCode: firstString(record.phoneCode, record.phone_code, record.prefix),
      service: firstString(record.service, service),
      price: firstNumber(record.price, record.cost, record.activationCost, record.value),
      currency: firstString(record.currency, record.currencyName),
      available: firstNumber(record.count, record.available, record.quantity, record.physicalCount),
      providerId: firstNumber(record.providerId, record.provider_id),
    };
  });
}

function normalizeProviderPriceRows(
  record: Record<string, unknown>,
  country: number,
  service: string,
): GrizzlySmsPriceItem[] {
  const rows: Array<GrizzlySmsPriceItem | null> = Object.entries(record)
    .map(([providerKey, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
      }
      const item = value as Record<string, unknown>;
      const price = firstNumber(item.price, item.cost, item.activationCost, item.value);
      const available = firstNumber(item.count, item.available, item.quantity, item.physicalCount);
      if (price == null && available == null) {
        return null;
      }
      return {
        countryId: firstNumber(item.country, item.countryId, item.country_id, country) ?? country,
        countryName: firstString(item.countryName, item.country_name, item.name),
        phoneCode: firstString(item.phoneCode, item.phone_code, item.prefix),
        service: firstString(item.service, service),
        price,
        currency: firstString(item.currency, item.currencyName),
        available,
        providerId: firstNumber(item.providerId, item.provider_id, providerKey),
      };
    });
  return rows.filter((item): item is GrizzlySmsPriceItem => item !== null);
}

function normalizePriceTierRows(
  record: Record<string, unknown>,
  country: number,
  service: string,
): GrizzlySmsPriceItem[] {
  const rows: Array<GrizzlySmsPriceItem | null> = Object.entries(record)
    .map(([priceKey, value]) => {
      const price = firstNumber(priceKey);
      if (price == null) {
        return null;
      }
      const available = value && typeof value === "object" && !Array.isArray(value)
        ? firstNumber((value as Record<string, unknown>).count, (value as Record<string, unknown>).available)
        : firstNumber(value);
      if (available == null) {
        return null;
      }
      return {
        countryId: country,
        countryName: "",
        phoneCode: "",
        service,
        price,
        currency: "",
        available,
        providerId: null,
      };
    });
  return rows.filter((item): item is GrizzlySmsPriceItem => item !== null);
}
