import assert from "node:assert/strict";
import {deriveStatus, isHtmlLikeUsageProbeResponse} from "../src/backend/auth-service.js";

const base = {
  ok: false,
  credentialType: "codex_auth" as const,
  limitReached: null,
  remainingPercent: null,
  refreshed: false,
};

assert.equal(isHtmlLikeUsageProbeResponse("<html><head><meta charset=\"utf-8\"></head></html>"), true);

assert.deepEqual(
  deriveStatus({
    ...base,
    rawStatus: 403,
    note: "<html><head><meta charset=\"utf-8\"></head></html>",
    rawBody: "<html><head><meta charset=\"utf-8\"></head></html>",
  }),
  {statusCode: "account_abnormal", statusLabel: "账号状态异常"},
);

assert.deepEqual(
  deriveStatus({
    ...base,
    rawStatus: 403,
    note: "forbidden",
    rawBody: "{\"error\":\"forbidden\"}",
  }),
  {statusCode: "account_abnormal", statusLabel: "账号状态异常"},
);

assert.deepEqual(
  deriveStatus({
    ...base,
    rawStatus: 403,
    note: "account_deactivated",
    rawBody: "{\"error\":{\"code\":\"account_deactivated\"}}",
  }),
  {statusCode: "account_deactivated", statusLabel: "账号已被封禁"},
);
