import { fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";
import { appConfig, parseProxyUrlCandidates, resolveOpenAIProxyUrl } from "../core/config.js";
import { createProxyDispatcher, maskProxyUrl } from "../core/proxy.js";

const DEFAULT_TEST_URL = "https://chatgpt.com/cdn-cgi/trace";
const PROXY_TEST_TIMEOUT_MS = 10000;
type ProxyTestKind = "default" | "residential";

export interface ProxyTestResult {
  ok: boolean;
  proxyUrl: string;
  targetUrl: string;
  status: number | null;
  elapsedMs: number;
  message: string;
  exitIp?: string;
  location?: string;
}

function normalizeTestUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return DEFAULT_TEST_URL;
  }
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("测试地址只支持 http/https");
  }
  return url.toString();
}

function normalizeProxyKind(value: unknown): ProxyTestKind {
  return value === "residential" ? "residential" : "default";
}

function resolveTestProxyUrl(input: { proxyUrl?: unknown; proxyKind?: unknown }): { proxyKind: ProxyTestKind; proxyUrl: string } {
  const rawProxyUrl = typeof input.proxyUrl === "string" ? input.proxyUrl.trim() : "";
  const proxyKind = normalizeProxyKind(input.proxyKind);
  if (rawProxyUrl) {
    return { proxyKind, proxyUrl: parseProxyUrlCandidates(rawProxyUrl)[0] ?? "" };
  }
  if (proxyKind === "residential") {
    return { proxyKind, proxyUrl: parseProxyUrlCandidates(appConfig.residentialProxyUrl)[0] ?? "" };
  }
  return { proxyKind, proxyUrl: resolveOpenAIProxyUrl() };
}

function parseTraceValue(rawBody: string, key: string): string | undefined {
  const prefix = `${key}=`;
  return rawBody
    .split(/\r?\n/)
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim() || undefined;
}

function parseExitIp(rawBody: string): string | undefined {
  const traceIp = parseTraceValue(rawBody, "ip");
  if (traceIp) {
    return traceIp;
  }
  try {
    const payload = JSON.parse(rawBody) as { ip?: unknown };
    return typeof payload.ip === "string" ? payload.ip : undefined;
  } catch {
    return undefined;
  }
}

function formatErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const cause = error.cause;
  const causeMessage = cause && typeof cause === "object" && "message" in cause
    ? String((cause as { message?: unknown }).message ?? "")
    : "";
  const causeCode = cause && typeof cause === "object" && "code" in cause
    ? String((cause as { code?: unknown }).code ?? "")
    : "";
  return [error.message, causeMessage, causeCode].filter(Boolean).join(" ");
}

export async function testProxyConnection(input: { proxyUrl?: unknown; targetUrl?: unknown; proxyKind?: unknown }): Promise<ProxyTestResult> {
  const { proxyKind, proxyUrl } = resolveTestProxyUrl(input);
  const targetUrl = normalizeTestUrl(input.targetUrl);
  const started = Date.now();
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), PROXY_TEST_TIMEOUT_MS);

  if (proxyKind === "residential" && !proxyUrl) {
    clearTimeout(timeout);
    return {
      ok: false,
      proxyUrl: "",
      targetUrl,
      status: null,
      elapsedMs: Date.now() - started,
      message: "家庭住宅代理未配置",
    };
  }

  try {
    const response = await undiciFetch(targetUrl, {
      method: "GET",
      dispatcher: createProxyDispatcher(proxyUrl, true),
      signal: abortController.signal,
      headers: {
        "user-agent": "codex-auth-manager/proxy-test",
      },
    } satisfies UndiciRequestInit);
    const rawBody = await response.text();
    const elapsedMs = Date.now() - started;
    return {
      ok: response.ok,
      proxyUrl: maskProxyUrl(proxyUrl),
      targetUrl,
      status: response.status,
      elapsedMs,
      message: response.ok ? "代理可用" : `请求完成但状态异常: ${response.status}`,
      exitIp: parseExitIp(rawBody),
      location: parseTraceValue(rawBody, "loc"),
    };
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      proxyUrl: maskProxyUrl(proxyUrl),
      targetUrl,
      status: null,
      elapsedMs,
      message: aborted ? `代理测试超时 (${PROXY_TEST_TIMEOUT_MS}ms)` : formatErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
