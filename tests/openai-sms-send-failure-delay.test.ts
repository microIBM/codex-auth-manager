import assert from "node:assert/strict";
import { OpenAIClient } from "../src/core/openai.js";
import type { ActivationLease, ISMSActivationBroker } from "../src/core/sms/activation-broker.js";

let getActivationCalls = 0;
const acquireTimes: number[] = [];
let sendPhoneOtpCalls = 0;
let discardCalls = 0;
let markAsSucceedCalls = 0;

function createLease(index: number): ActivationLease {
  return {
    activationId: `act-${index}`,
    phoneNumber: `1555000000${index}`,
    isNewActivation: true,
    requestedAnotherSms: false,
    round: 1,
    waitForVerificationCode: async () => ({
      code: "123456",
      source: "test",
    }),
  };
}

const smsBroker: ISMSActivationBroker = {
  async getActivation() {
    getActivationCalls += 1;
    acquireTimes.push(Date.now());
    return createLease(getActivationCalls);
  },
  async markAsSucceed() {
    markAsSucceedCalls += 1;
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
  email: "sms-send-delay@example.com",
  password: "password123",
  smsBroker,
});

Object.assign(client as unknown as Record<string, unknown>, {
  sendPhoneOtp: async () => {
    sendPhoneOtpCalls += 1;
    if (sendPhoneOtpCalls === 1) {
      throw new Error("SendPhoneOtp请求失败: 400 code=temporary_sms_error");
    }
  },
  validatePhone: async () => "https://auth.openai.com/continue",
});

const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
try {
  console.warn = () => undefined;
  console.log = () => undefined;
  const nextUrl = await (client as unknown as { runSmsVerification: () => Promise<string> }).runSmsVerification();

  assert.equal(nextUrl, "https://auth.openai.com/continue");
  assert.equal(getActivationCalls, 2);
  assert.equal(sendPhoneOtpCalls, 2);
  assert.equal(discardCalls, 1);
  assert.equal(markAsSucceedCalls, 1);
  assert.ok(acquireTimes[1] - acquireTimes[0] >= 4900);
} finally {
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  await client.dispose();
}
