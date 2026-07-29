import assert from "node:assert/strict";
import { OpenAIClient } from "../src/core/openai.js";
import type { ActivationLease, ISMSActivationBroker } from "../src/core/sms/activation-broker.js";

let getActivationCalls = 0;
let sendPhoneOtpCalls = 0;
let discardCalls = 0;

const lease: ActivationLease = {
  activationId: "act-fraud",
  phoneNumber: "15550000001",
  isNewActivation: true,
  requestedAnotherSms: false,
  round: 1,
  waitForVerificationCode: async () => {
    throw new Error("waitForVerificationCode should not be called");
  },
};

const smsBroker: ISMSActivationBroker = {
  async getActivation() {
    getActivationCalls += 1;
    return lease;
  },
  async markAsSucceed() {
    throw new Error("markAsSucceed should not be called");
  },
  async markAsFailed() {
    throw new Error("markAsFailed should not be called");
  },
  async discardCurrentActivationAndCancelLater() {
    discardCalls += 1;
  },
  discardCurrentActivation() {
    throw new Error("discardCurrentActivation should not be called");
  },
};

const client = new OpenAIClient({
  email: "sms-fraud@example.com",
  password: "password123",
  smsBroker,
});

Object.assign(client as unknown as Record<string, unknown>, {
  sendPhoneOtp: async () => {
    sendPhoneOtpCalls += 1;
    throw new Error("SendPhoneOtp请求失败: 400 code=fraud_guard");
  },
});

const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
try {
  console.warn = () => undefined;
  console.log = () => undefined;
  await assert.rejects(
    () => (client as unknown as { runSmsVerification: () => Promise<string> }).runSmsVerification(),
    /fraud_guard/,
  );
  assert.equal(getActivationCalls, 1);
  assert.equal(sendPhoneOtpCalls, 1);
  assert.equal(discardCalls, 1);
} finally {
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  await client.dispose();
}
