import assert from "node:assert/strict";
import { buildBrowserHeaders, defaultDeviceProfile } from "../src/core/device-profile.js";
import { buildUsageProbeRequestContext } from "../src/backend/auth-service.js";

const profile = {
  ...defaultDeviceProfile(),
  id: "profile-123",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8",
  languages: ["zh-CN", "zh"],
};

const headers = buildBrowserHeaders(profile, { Origin: "https://chatgpt.com" });
assert.equal(headers["user-agent"], profile.userAgent);
assert.equal(headers["accept-language"], profile.acceptLanguage);
assert.equal(headers["sec-ch-ua-mobile"], "?0");

const context = buildUsageProbeRequestContext("acct-123", profile);
assert.equal(context.userAgent, profile.userAgent);
assert.equal(context.acceptLanguage, profile.acceptLanguage);
assert.equal(context.deviceProfileId, profile.id);
