import assert from "node:assert/strict";
import {createGrizzlySmsProvider} from "../src/core/sms/grizzlySMS.js";

const requests: URL[] = [];
const statusResponses = ["STATUS_WAIT_CODE", "STATUS_OK:OpenAI code 654321"];
const originalConsoleLog = console.log;

try {
  console.log = () => undefined;
  const provider = createGrizzlySmsProvider({
    apiKey: "api-key",
    baseUrl: "https://example.test/stubs/handler_api.php",
    defaultRequestOptions: {
      service: "dr",
      country: 7,
      maxPrice: 0.12,
    },
    defaultWaitForCodeOptions: {
      pollAttempts: 2,
      pollIntervalMs: 1,
      markReady: true,
      completeOnCode: true,
    },
    fetchImpl: async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      const action = url.searchParams.get("action");
      if (action === "getNumber") {
        return new Response("ACCESS_NUMBER:555:79001234567");
      }
      if (action === "getStatus") {
        return new Response(statusResponses.shift() ?? "STATUS_WAIT_CODE");
      }
      if (action === "setStatus") {
        return new Response(`ACCESS_STATUS_${url.searchParams.get("status")}`);
      }
      throw new Error(`unexpected action: ${action}`);
    },
  });

  const activation = await provider.requestActivation();
  assert.deepEqual(activation, {
    activationId: "555",
    phoneNumber: "79001234567",
    canRequestAnotherSms: true,
  });

  const numberRequest = requests[0];
  assert.equal(numberRequest.searchParams.get("api_key"), "api-key");
  assert.equal(numberRequest.searchParams.get("action"), "getNumber");
  assert.equal(numberRequest.searchParams.get("service"), "dr");
  assert.equal(numberRequest.searchParams.get("country"), "7");
  assert.equal(numberRequest.searchParams.get("maxPrice"), "0.12");

  const verification = await provider.waitForVerificationCode("555");
  assert.equal(verification.code, "654321");
  assert.equal(verification.source, "status");
  assert.equal(verification.text, "OpenAI code 654321");

  assert.deepEqual(
    requests
      .filter((url) => url.searchParams.get("action") === "setStatus")
      .map((url) => url.searchParams.get("status")),
    ["1", "6"],
  );

  const retryResult = await provider.requestAnotherSms("555");
  assert.equal(retryResult, "ACCESS_STATUS_3");
  const cancelResult = await provider.cancelActivation("555");
  assert.equal(cancelResult, "ACCESS_STATUS_8");
} finally {
  console.log = originalConsoleLog;
}
