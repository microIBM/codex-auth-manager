import assert from "node:assert/strict";
import {
  attachRegistrationFailureEmail,
  attachRegistrationFailureSmsStats,
  resolveRegistrationFailureEmail,
  resolveRegistrationFailureSmsStats,
} from "../src/backend/registration-service.js";

const error = new Error("PasswordVerify request failed");

attachRegistrationFailureEmail(error, "  User.Name@HOTMAIL.COM  ");

assert.equal(
  resolveRegistrationFailureEmail(error, ""),
  "user.name@hotmail.com",
);

assert.equal(
  resolveRegistrationFailureEmail(new Error("plain failure"), "Fallback@Example.COM"),
  "fallback@example.com",
);

assert.equal(resolveRegistrationFailureEmail("plain failure", ""), "");

const smsError = new Error("SMS failed");
attachRegistrationFailureSmsStats(smsError, {
  getHistory: () => ({
    phoneStats: {
      "15550000001": {},
      "15550000002": {},
    },
    totalAttemptsSucceeded: 1,
  }),
});

assert.deepEqual(resolveRegistrationFailureSmsStats(smsError), {
  smsNumbersUsed: 2,
  smsSuccessCount: 1,
});
assert.deepEqual(resolveRegistrationFailureSmsStats("plain failure"), {
  smsNumbersUsed: 0,
  smsSuccessCount: 0,
});
