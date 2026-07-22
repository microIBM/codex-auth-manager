import assert from "node:assert/strict";
import {
  DEFAULT_REGISTRATION_CONCURRENCY,
  resolveRegistrationConcurrency,
  runConcurrentRegistrationRounds,
} from "../src/backend/registration-concurrency.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

assert.equal(DEFAULT_REGISTRATION_CONCURRENCY, 8);
assert.equal(resolveRegistrationConcurrency(undefined), 8);
assert.equal(resolveRegistrationConcurrency(""), 8);
assert.equal(resolveRegistrationConcurrency("3"), 3);
assert.equal(resolveRegistrationConcurrency(2.8), 2);
assert.equal(resolveRegistrationConcurrency(0), 1);

let active = 0;
let maxActive = 0;
const started: number[] = [];
const finished: number[] = [];

const outcomes = await runConcurrentRegistrationRounds({
  totalRounds: 6,
  concurrency: 2,
  waitBetweenRoundsMs: 0,
  runRound: async (index) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    started.push(index);
    await wait(20);
    finished.push(index);
    active -= 1;
    return `email-${index}@example.com`;
  },
});

assert.equal(maxActive, 2);
assert.deepEqual(started.sort((left, right) => left - right), [0, 1, 2, 3, 4, 5]);
assert.deepEqual(finished.sort((left, right) => left - right), [0, 1, 2, 3, 4, 5]);
assert.deepEqual(outcomes.map((item) => item.result), [
  "email-0@example.com",
  "email-1@example.com",
  "email-2@example.com",
  "email-3@example.com",
  "email-4@example.com",
  "email-5@example.com",
]);

await assert.rejects(
  () => runConcurrentRegistrationRounds({
    totalRounds: 3,
    concurrency: 2,
    abortOnError: (error) => error instanceof Error && error.message === "cancelled",
    runRound: async (index) => {
      if (index === 0) {
        throw new Error("cancelled");
      }
      await wait(5);
      return index;
    },
  }),
  /cancelled/,
);

const tailDelayStartedAt = Date.now();
await runConcurrentRegistrationRounds({
  totalRounds: 2,
  concurrency: 2,
  waitBetweenRoundsMs: 200,
  runRound: async (index) => index,
});
const tailDelayElapsedMs = Date.now() - tailDelayStartedAt;
assert.ok(
  tailDelayElapsedMs < 100,
  `final batch should not wait for another loop delay, elapsed=${tailDelayElapsedMs}ms`,
);

const threadContexts: Array<{index: number; workerId?: number; threadLabel?: string}> = [];
await runConcurrentRegistrationRounds({
  totalRounds: 5,
  concurrency: 3,
  runRound: async (index, context) => {
    threadContexts.push({
      index,
      workerId: context?.workerId,
      threadLabel: context?.threadLabel,
    });
    await wait(5);
    return index;
  },
});

assert.equal(threadContexts.length, 5);
assert.deepEqual(
  threadContexts
    .slice(0, 3)
    .map((item) => item.workerId)
    .sort((left, right) => Number(left) - Number(right)),
  [1, 2, 3],
);
assert.ok(threadContexts.every((item) => typeof item.workerId === "number" && item.workerId >= 1));
assert.ok(threadContexts.every((item) => item.threadLabel === `线程 ${item.workerId}`));
