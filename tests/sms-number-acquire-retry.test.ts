import assert from "node:assert/strict";
import { OpenAIClient } from "../src/core/openai.js";
import type { ActivationLease, ISMSActivationBroker } from "../src/core/sms/activation-broker.js";

let acquireAttempts = 0;
const acquireTimes: number[] = [];
let sendPhoneOtpCalls = 0;
let markAsSucceedCalls = 0;

const lease: ActivationLease = {
  activationId: "act-2",
  phoneNumber: "15550000002",
  isNewActivation: true,
  requestedAnotherSms: false,
  round: 1,
  waitForVerificationCode: async () => ({
    code: "123456",
    source: "test",
  }),
};

const smsBroker: ISMSActivationBroker = {
  async getActivation() {
    acquireAttempts += 1;
    acquireTimes.push(Date.now());
    if (acquireAttempts === 1) {
      throw new Error("SMSBower getNumber failed: NO_NUMBERS");
    }
    return lease;
  },
  async markAsSucceed() {
    markAsSucceedCalls += 1;
  },
  async markAsFailed() {
    throw new Error("markAsFailed should not be called");
  },
  async discardCurrentActivationAndCancelLater() {
    throw new Error("discardCurrentActivationAndCancelLater should not be called");
  },
  discardCurrentActivation() {
    throw new Error("discardCurrentActivation should not be called");
  },
};

const client = new OpenAIClient({
  email: "sms-retry@example.com",
  password: "password123",
  smsBroker,
});

Object.assign(client as unknown as Record<string, unknown>, {
  sendPhoneOtp: async () => {
    sendPhoneOtpCalls += 1;
  },
  validatePhone: async () => "https://auth.openai.com/continue",
});

const originalConsoleWarn = console.warn;
try {
  console.warn = () => undefined;
  const nextUrl = await (client as unknown as { runSmsVerification: () => Promise<string> }).runSmsVerification();
  assert.equal(nextUrl, "https://auth.openai.com/continue");
  assert.equal(acquireAttempts, 2);
  assert.ok(acquireTimes[1] - acquireTimes[0] >= 900);
  assert.equal(sendPhoneOtpCalls, 1);
  assert.equal(markAsSucceedCalls, 1);
} finally {
  console.warn = originalConsoleWarn;
}
