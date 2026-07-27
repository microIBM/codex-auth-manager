import assert from "node:assert/strict";
import {abortableDelay} from "../src/core/utils.js";

const warnings: Error[] = [];
const onWarning = (warning: Error) => warnings.push(warning);

process.on("warning", onWarning);

try {
  const controller = new AbortController();
  const waitCount = 150;
  const waits = Array.from({length: waitCount}, () =>
    abortableDelay(1000, controller.signal).catch((error) =>
      error instanceof Error ? error.message : String(error),
    ),
  );

  controller.abort();

  const results = await Promise.all(waits);
  assert.deepEqual(results, Array.from({length: waitCount}, () => "Job cancelled"));
  assert.equal(warnings.some((warning) => warning.name === "MaxListenersExceededWarning"), false);
} finally {
  process.off("warning", onWarning);
}
