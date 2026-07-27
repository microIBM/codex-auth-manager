import assert from "node:assert/strict";
import {
  attachRegistrationFailureEmail,
  attachRegistrationFailureSmsStats,
  isAccountDeactivatedRegistrationError,
  isPermanentRegistrationMailboxFailure,
  resolveRegistrationFailureEmail,
  resolveRegistrationFailureSmsStats,
  shouldReleaseMailboxAfterRegistrationFailure,
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

const deactivatedError = new Error("EmailOtpValidate请求失败: 403 code=account_deactivated");
assert.equal(isAccountDeactivatedRegistrationError(deactivatedError), true);
assert.equal(isPermanentRegistrationMailboxFailure(deactivatedError), true);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(deactivatedError), false);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("EmailOtpSend请求失败: 400 code=email_domain_blocked")), false);
assert.equal(
  shouldReleaseMailboxAfterRegistrationFailure(new Error('CreateAccount请求失败: 400 {"error":{"code":"disposable_email_not_allowed"}}')),
  false,
);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("OpenAI returned: account has been suspended")), false);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("AuthorizeContinue注册请求失败: 400 code=user_already_exists")), true);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("PasswordVerify请求失败: 401 code=invalid_username_or_password")), true);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("EmailOtpValidate请求失败: 401 code=wrong_email_otp_code")), true);
assert.equal(shouldReleaseMailboxAfterRegistrationFailure(new Error("SMSBower getNumber 请求失败: NO_NUMBERS")), true);
