import assert from "node:assert/strict";
import {findLatestVerificationMail} from "../src/core/mail/verification-matcher.js";

const targetEmail = "user@example.com";
const requestedAt = Date.now();

const matched = findLatestVerificationMail([
  {
    recipient: targetEmail,
    subject: "OpenAI verification code",
    content: "Your OpenAI verification code is 111111",
    timestamp: requestedAt - 60_000,
  },
  {
    recipient: targetEmail,
    subject: "OpenAI verification code",
    content: "Your OpenAI verification code is 222222",
    timestamp: requestedAt + 1_000,
  },
], {
  targetEmail,
  minTimestamp: requestedAt,
  rememberLastCode: false,
});

assert.equal(matched?.verificationCode, "222222");

const staleOnly = findLatestVerificationMail([
  {
    recipient: targetEmail,
    subject: "OpenAI verification code",
    content: "Your OpenAI verification code is 333333",
    timestamp: requestedAt - 60_000,
  },
], {
  targetEmail,
  minTimestamp: requestedAt,
  rememberLastCode: false,
});

assert.equal(staleOnly, null);
