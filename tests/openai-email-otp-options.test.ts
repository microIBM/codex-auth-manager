import assert from "node:assert/strict";
import {OpenAIClient} from "../src/core/openai.js";
import type {EmailVerificationCodeOptions} from "../src/core/mailbox.js";

let receivedOptions: EmailVerificationCodeOptions | undefined;
const client = new OpenAIClient({
  email: "user@example.com",
  password: "password123",
  emailOtpProvider: async (_email, options) => {
    receivedOptions = options;
    return "123456";
  },
});

(client as unknown as {emailOtpRequestedAtMs: number}).emailOtpRequestedAtMs = 100_000;

const code = await (client as unknown as {
  resolveEmailOtpCode: (excludeCodes: string[]) => Promise<string>;
}).resolveEmailOtpCode(["111111"]);

assert.equal(code, "123456");
assert.deepEqual(receivedOptions?.excludeCodes, ["111111"]);
assert.equal(receivedOptions?.minTimestamp, 90_000);
assert.ok(receivedOptions?.abortSignal);

await client.dispose();
