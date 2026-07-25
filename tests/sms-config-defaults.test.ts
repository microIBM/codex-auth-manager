import assert from "node:assert/strict";
import {DEFAULT_CONFIG, SECRET_CONFIG_KEYS, resolveOpenAIProxyUrl, type SmsProviderName} from "../src/core/config.js";

const provider: SmsProviderName = "smsbower";

assert.equal(provider, "smsbower");
assert.equal(DEFAULT_CONFIG.smsBowerApiKey, "");
assert.equal(DEFAULT_CONFIG.smsBowerCountry, 7);
assert.equal(DEFAULT_CONFIG.smsBowerMaxPrice, 0.1);
assert.equal(DEFAULT_CONFIG.smsBowerPollAttempts, 10);
assert.equal(DEFAULT_CONFIG.smsBowerPollIntervalMs, 3000);
assert.equal(SECRET_CONFIG_KEYS.has("smsBowerApiKey"), true);
assert.equal(DEFAULT_CONFIG.residentialProxyEnabled, false);
assert.equal(DEFAULT_CONFIG.residentialProxyUrl, "");
assert.equal(SECRET_CONFIG_KEYS.has("residentialProxyUrl"), true);
assert.equal(
  resolveOpenAIProxyUrl({
    ...DEFAULT_CONFIG,
    defaultProxyUrl: "http://default-proxy:10808",
    residentialProxyEnabled: true,
    residentialProxyUrl: "http://home-proxy:8000",
  }),
  "http://home-proxy:8000",
);
assert.equal(
  resolveOpenAIProxyUrl({
    ...DEFAULT_CONFIG,
    defaultProxyUrl: "http://default-proxy:10808",
    residentialProxyEnabled: true,
    residentialProxyUrl: "",
  }),
  "http://default-proxy:10808",
);
