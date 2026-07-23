import assert from "node:assert/strict";
import {DEFAULT_CONFIG, SECRET_CONFIG_KEYS, type SmsProviderName} from "../src/core/config.js";

const provider: SmsProviderName = "smsbower";

assert.equal(provider, "smsbower");
assert.equal(DEFAULT_CONFIG.smsBowerApiKey, "");
assert.equal(DEFAULT_CONFIG.smsBowerCountry, 7);
assert.equal(DEFAULT_CONFIG.smsBowerMaxPrice, 0.1);
assert.equal(DEFAULT_CONFIG.smsBowerPollAttempts, 10);
assert.equal(DEFAULT_CONFIG.smsBowerPollIntervalMs, 3000);
assert.equal(SECRET_CONFIG_KEYS.has("smsBowerApiKey"), true);
