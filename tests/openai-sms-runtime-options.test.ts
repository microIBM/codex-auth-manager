import assert from "node:assert/strict";
import {OpenAIClient} from "../src/core/openai.js";
import type {
  ActivationLease,
  ActivationWaitForCodeOptions,
  ISMSActivationBroker,
} from "../src/core/sms/activation-broker.js";

const waitOptions: ActivationWaitForCodeOptions[] = [];
let getActivationCalls = 0;
let sendPhoneOtpCalls = 0;
let discardCalls = 0;
let markAsFailedCalls = 0;
let markAsSucceedCalls = 0;

function createLease(index: number): ActivationLease {
  return {
    activationId: `act-${index}`,
    phoneNumber: `1555000000${index}`,
    isNewActivation: true,
    requestedAnotherSms: false,
    round: 1,
    waitForVerificationCode: async (options) => {
      waitOptions.push(options ?? {});
      if (index === 1) {
        throw new Error("SMSBower 长时间未收到验证码: STATUS_WAIT_CODE");
      }
      return {
        code: "123456",
        source: "test",
      };
    },
  };
}

const smsBroker: ISMSActivationBroker = {
  async getActivation() {
    getActivationCalls += 1;
    return createLease(getActivationCalls);
  },
  async markAsSucceed() {
    markAsSucceedCalls += 1;
  },
  async markAsFailed() {
    markAsFailedCalls += 1;
  },
  async discardCurrentActivationAndCancelLater() {
    discardCalls += 1;
  },
  discardCurrentActivation() {
    discardCalls += 1;
  },
};

const client = new OpenAIClient({
  email: "sms-options@example.com",
  password: "password123",
  smsBroker,
  smsPollAttempts: 7,
  smsMaxSendsPerPhone: 1,
});

Object.assign(client as unknown as Record<string, unknown>, {
  sendPhoneOtp: async () => {
    sendPhoneOtpCalls += 1;
  },
  validatePhone: async () => "https://auth.openai.com/continue",
});

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

try {
  console.log = () => undefined;
  console.warn = () => undefined;
  const nextUrl = await (client as unknown as { runSmsVerification: () => Promise<string> }).runSmsVerification();

  assert.equal(nextUrl, "https://auth.openai.com/continue");
  assert.equal(getActivationCalls, 2);
  assert.equal(sendPhoneOtpCalls, 2);
  assert.equal(discardCalls, 1);
  assert.equal(markAsFailedCalls, 0);
  assert.equal(markAsSucceedCalls, 1);
  assert.equal(waitOptions.length, 2);
  assert.equal(waitOptions[0].pollAttempts, 7);
  assert.equal(waitOptions[1].pollAttempts, 7);
} finally {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  await client.dispose();
}
