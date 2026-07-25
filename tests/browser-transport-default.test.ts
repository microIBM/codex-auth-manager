import assert from "node:assert/strict";
import { OpenAIClient } from "../src/core/openai.js";

const prototype = OpenAIClient.prototype as unknown as Record<string, unknown>;
const originalResolveBrowserExecutablePath = prototype.resolveBrowserExecutablePath;
const originalEnvValue = process.env.OPENAI_BROWSER_TRANSPORT;

try {
  prototype.resolveBrowserExecutablePath = () => "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  delete process.env.OPENAI_BROWSER_TRANSPORT;

  const defaultClient = new OpenAIClient({
    email: "default@example.com",
    password: "password123",
    smsVerificationDisabled: true,
  });

  assert.equal(
    (defaultClient as unknown as { browserTransportEnabled: boolean }).browserTransportEnabled,
    false,
  );

  process.env.OPENAI_BROWSER_TRANSPORT = "1";

  const enabledClient = new OpenAIClient({
    email: "enabled@example.com",
    password: "password123",
    smsVerificationDisabled: true,
  });

  assert.equal(
    (enabledClient as unknown as { browserTransportEnabled: boolean }).browserTransportEnabled,
    true,
  );
} finally {
  if (typeof originalResolveBrowserExecutablePath === "function") {
    prototype.resolveBrowserExecutablePath = originalResolveBrowserExecutablePath;
  } else {
    delete prototype.resolveBrowserExecutablePath;
  }
  if (originalEnvValue === undefined) {
    delete process.env.OPENAI_BROWSER_TRANSPORT;
  } else {
    process.env.OPENAI_BROWSER_TRANSPORT = originalEnvValue;
  }
}
