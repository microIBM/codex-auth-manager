import assert from "node:assert/strict";
import { createHeroSmsProvider } from "../src/core/sms/heroSMS.js";

const requests: URL[] = [];
const warnings: string[] = [];
const originalConsoleWarn = console.warn;

try {
  console.warn = (...items: unknown[]) => {
    warnings.push(items.map((item) => String(item)).join(" "));
  };

  const provider = createHeroSmsProvider({
    apiKey: "api-key",
    baseUrl: "https://example.test/stubs/handler_api.php",
    defaultRequestOptions: {
      service: "dr",
      country: 33,
      maxPrice: 0.055,
      fixedPrice: true,
    },
    fetchImpl: async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      if (requests.length === 1) {
        return new Response("NO_NUMBERS");
      }
      return new Response(JSON.stringify({
        activationId: "12345",
        phoneNumber: "573001112233",
        activationCost: 0.055,
        countryCode: 33,
      }));
    },
  });

  const activation = await provider.requestActivation();

  assert.equal(activation.activationId, "12345");
  assert.equal(activation.phoneNumber, "573001112233");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].searchParams.get("action"), "getNumberV2");
  assert.equal(requests[0].searchParams.get("country"), "33");
  assert.equal(requests[0].searchParams.get("maxPrice"), "0.055");
  assert.equal(requests[0].searchParams.get("fixedPrice"), "true");
  assert.equal(requests[1].searchParams.get("country"), "33");
  assert.equal(requests[1].searchParams.get("maxPrice"), "0.055");
  assert.equal(requests[1].searchParams.has("fixedPrice"), false);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /fixedPrice=true/);
} finally {
  console.warn = originalConsoleWarn;
}
