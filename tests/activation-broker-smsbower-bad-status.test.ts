import assert from "node:assert/strict";
import {ActivationBroker} from "../src/core/sms/activation-broker.js";
import type {
  SmsActivation,
  SmsProvider,
  SmsVerificationCode,
} from "../src/core/sms/provider.js";

const activation: SmsActivation = {
  activationId: "498675150",
  phoneNumber: "19072518342",
  canRequestAnotherSms: true,
};

let requestActivationCalls = 0;
let requestAnotherSmsCalls = 0;

const provider: SmsProvider<SmsActivation, SmsVerificationCode> = {
  async requestActivation() {
    requestActivationCalls += 1;
    return activation;
  },
  async requestAnotherSms() {
    requestAnotherSmsCalls += 1;
    throw new Error("SMSBower setStatus 请求失败: BAD_STATUS");
  },
  async waitForVerificationCode() {
    return {
      code: "123456",
      source: "test",
    };
  },
  async completeActivation() {
    return "ACCESS_STATUS_6";
  },
  async cancelAndWithdraw() {
    return "ACCESS_STATUS_8";
  },
  async cancelActivation() {
    return "ACCESS_STATUS_8";
  },
};

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

try {
  console.log = () => undefined;
  console.warn = () => undefined;

  const broker = new ActivationBroker(provider);

  const firstLease = await broker.getActivation();
  assert.equal(firstLease.activationId, activation.activationId);
  assert.equal(firstLease.isNewActivation, true);
  assert.equal(firstLease.round, 1);

  await broker.markAsFailed(false);
  const secondLease = await broker.getActivation();

  assert.equal(requestActivationCalls, 1);
  assert.equal(requestAnotherSmsCalls, 0);
  assert.equal(secondLease.activationId, activation.activationId);
  assert.equal(secondLease.isNewActivation, false);
  assert.equal(secondLease.requestedAnotherSms, true);
  assert.equal(secondLease.round, 2);

  await broker.markAsSucceed();
  const thirdLease = await broker.getActivation();

  assert.equal(requestActivationCalls, 1);
  assert.equal(requestAnotherSmsCalls, 1);
  assert.equal(thirdLease.activationId, activation.activationId);
  assert.equal(thirdLease.isNewActivation, false);
  assert.equal(thirdLease.requestedAnotherSms, true);
  assert.equal(thirdLease.round, 3);
} finally {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
}
