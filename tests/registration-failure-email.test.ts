import assert from "node:assert/strict";
import {
  attachRegistrationFailureEmail,
  resolveRegistrationFailureEmail,
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
