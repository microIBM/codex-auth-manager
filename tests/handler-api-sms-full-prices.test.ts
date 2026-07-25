import assert from "node:assert/strict";
import { normalizeHandlerApiSmsPrices } from "../src/backend/grizzly-sms-service.js";

const prices = normalizeHandlerApiSmsPrices({
  "12": {
    dr: {
      "2266": { count: 1, price: 0.054, provider_id: 2266 },
      "2440": { count: 3909, price: 0.004, provider_id: 2440 },
      "2442": { count: 4662, price: 0.312, provider_id: 2442 },
    },
  },
}, 12, "dr");

assert.equal(prices.length, 3);
assert.deepEqual(prices.map((price) => price.providerId), [2440, 2266, 2442]);
assert.deepEqual(prices.map((price) => price.price), [0.004, 0.054, 0.312]);
assert.deepEqual(prices.map((price) => price.available), [3909, 1, 4662]);

const tierPrices = normalizeHandlerApiSmsPrices({
  "12": {
    dr: {
      "0.004": 144154,
      "0.054": 1,
      "0.316": 352808,
    },
  },
}, 12, "dr");

assert.equal(tierPrices.length, 3);
assert.deepEqual(tierPrices.map((price) => price.providerId), [null, null, null]);
assert.deepEqual(tierPrices.map((price) => price.price), [0.004, 0.054, 0.316]);
assert.deepEqual(tierPrices.map((price) => price.available), [144154, 1, 352808]);
