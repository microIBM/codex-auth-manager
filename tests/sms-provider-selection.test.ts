import assert from "node:assert/strict";
import {createSmsProvider} from "../src/core/sms/index.js";

const requests: URL[] = [];
const provider = createSmsProvider({
  provider: "grizzly-sms",
  apiKey: "api-key",
  country: 7,
  maxPrice: 0.12,
  pollAttempts: 1,
  pollIntervalMs: 1,
  fetchImpl: async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    return new Response("ACCESS_NUMBER:777:79007654321");
  },
});

const activation = await provider.requestActivation();

assert.equal(activation.activationId, "777");
assert.equal(activation.phoneNumber, "79007654321");
assert.equal(requests[0].hostname, "api.grizzlysms.com");
assert.equal(requests[0].searchParams.get("action"), "getNumber");
