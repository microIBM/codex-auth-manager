import assert from "node:assert/strict";
import {
  addJobEvent,
  createJob,
  listJobEvents,
  runJob,
  withJobLogThread,
} from "../src/backend/job-service.js";

const job = createJob("test_thread_log", "线程日志上下文测试", {});
const originalConsoleLog = console.log;

try {
  console.log = () => undefined;
  await runJob(job.id, async () => {
    await withJobLogThread("线程 2", async () => {
      addJobEvent(job.id, "info", "显式事件");
      console.log("控制台事件");
    });
  });
} finally {
  console.log = originalConsoleLog;
}

const messages = listJobEvents(job.id).map((event) => event.message);

assert.ok(messages.includes("[线程 2] 显式事件"));
assert.ok(messages.includes("[线程 2] 控制台事件"));
assert.ok(!messages.some((message) => message.startsWith("[线程 2] jobStatus:")));
