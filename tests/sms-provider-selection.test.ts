import assert from "node:assert/strict";
import {createSmsProvider} from "../src/core/sms/index.js";

const grizzlyRequests: URL[] = [];
const grizzlyProvider = createSmsProvider({
  provider: "grizzly-sms",
  apiKey: "api-key",
  country: 7,
  maxPrice: 0.12,
  pollAttempts: 1,
  pollIntervalMs: 1,
  fetchImpl: async (input) => {
    const url = new URL(String(input));
    grizzlyRequests.push(url);
    return new Response("ACCESS_NUMBER:777:79007654321");
  },
});

const grizzlyActivation = await grizzlyProvider.requestActivation();

assert.equal(grizzlyActivation.activationId, "777");
assert.equal(grizzlyActivation.phoneNumber, "79007654321");
assert.equal(grizzlyRequests[0].hostname, "api.grizzlysms.com");
assert.equal(grizzlyRequests[0].searchParams.get("action"), "getNumber");

const smsBowerRequests: URL[] = [];
const smsBowerProvider = createSmsProvider({
  provider: "smsbower",
  apiKey: "api-key",
  country: 151,
  maxPrice: 0.2,
  pollAttempts: 1,
  pollIntervalMs: 1,
  fetchImpl: async (input) => {
    const url = new URL(String(input));
    smsBowerRequests.push(url);
    return new Response("ACCESS_NUMBER:888:56987654321");
  },
});

const smsBowerActivation = await smsBowerProvider.requestActivation();

assert.equal(smsBowerActivation.activationId, "888");
assert.equal(smsBowerActivation.phoneNumber, "56987654321");
assert.equal(smsBowerRequests[0].hostname, "smsbower.page");
assert.equal(smsBowerRequests[0].searchParams.get("action"), "getNumber");
assert.equal(smsBowerRequests[0].searchParams.get("service"), "dr");
assert.equal(smsBowerRequests[0].searchParams.get("country"), "151");
