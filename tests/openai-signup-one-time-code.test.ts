import assert from "node:assert/strict";
import {Headers, Response} from "undici";
import {
  AUTH_BASE_URL,
  DEFAULT_REDIRECT_URI,
  AUTH_PASSWORDLESS_OTP_SEND_URL,
} from "../src/core/constants.js";
import {OpenAIClient} from "../src/core/openai.js";

const client = new OpenAIClient({
  email: "registered@example.com",
  password: "password123",
});

const calls: string[] = [];

(client as unknown as {openDirectSignupAuthorizePage: (email: string) => Promise<void>}).openDirectSignupAuthorizePage = async (email) => {
  calls.push(`open:${email}`);
};
client.authorizeContinueForSignup = async () => {
  calls.push("continue");
  return `${AUTH_BASE_URL}/log-in/password`;
};
client.sendPasswordlessLoginOtp = async () => {
  calls.push("send-passwordless-otp");
  return `${AUTH_BASE_URL}/email-verification`;
};
client.emailOtpValidate = async () => {
  calls.push("validate-otp");
  return `${AUTH_BASE_URL}/sign-in-with-chatgpt/codex/consent`;
};
client.selectWorkspace = async (url) => {
  calls.push(`workspace:${url}`);
  return DEFAULT_REDIRECT_URI;
};
(client as unknown as {finalizeAuthorizationFromContinueURL: (url: string) => Promise<unknown>}).finalizeAuthorizationFromContinueURL = async (url) => {
  calls.push(`finalize:${url}`);
  return {
    callbackURL: url,
    code: "code",
    state: "state",
    authFile: "auth.json",
  };
};

const result = await client.authRegisterAndAuthorizeHTTP();

assert.deepEqual(calls, [
  "open:registered@example.com",
  "continue",
  "send-passwordless-otp",
  "validate-otp",
  `workspace:${AUTH_BASE_URL}/sign-in-with-chatgpt/codex/consent`,
  `finalize:${DEFAULT_REDIRECT_URI}`,
]);
assert.equal(result.authFile, "auth.json");

await client.dispose();

const sendClient = new OpenAIClient({
  email: "registered@example.com",
  password: "password123",
});
let requestURL = "";
let requestMethod = "";
let requestReferer = "";
(sendClient as unknown as {fetch: unknown}).fetch = async (input: unknown, init?: {method?: string; headers?: unknown}) => {
  requestURL = String(input);
  requestMethod = init?.method ?? "GET";
  requestReferer = new Headers(init?.headers as ConstructorParameters<typeof Headers>[0]).get("referer") ?? "";
  return new Response(JSON.stringify({
    page: {
      type: "email_otp_verification",
    },
  }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};

const nextURL = await sendClient.sendPasswordlessLoginOtp();

assert.equal(requestURL, AUTH_PASSWORDLESS_OTP_SEND_URL);
assert.equal(requestMethod, "POST");
assert.equal(requestReferer, `${AUTH_BASE_URL}/log-in/password`);
assert.equal(nextURL, `${AUTH_BASE_URL}/email-verification`);

await sendClient.dispose();
