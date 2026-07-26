import {spawn} from "node:child_process";
import {createRequire} from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function resolveBin(packageName, binName = packageName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const manifest = require(packageJsonPath);
  const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[binName];
  if (!bin) {
    throw new Error(`Cannot resolve bin ${binName} from ${packageName}`);
  }
  return path.resolve(path.dirname(packageJsonPath), bin);
}

const commands = [
  ["api", process.execPath, [resolveBin("tsx"), "watch", "src/backend/server.ts"]],
  ["vite", process.execPath, [resolveBin("vite"), "--config", "web/vite.config.ts"]],
];

const children = commands.map(([label, command, args]) => {
  const child = spawn(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));
  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      process.exitCode = code;
      void shutdown(code);
    }
  });
  return child;
});

let shuttingDown = false;
let shutdownPromise = null;

function waitForClose(child, timeoutMs = 5000) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    child.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.on("error", () => {
      child.kill();
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function shutdown(exitCode = process.exitCode ?? 0) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shuttingDown = true;
  process.exitCode = typeof exitCode === "number" ? exitCode : 0;

  shutdownPromise = Promise.all(children.map(async (child) => {
    killProcessTree(child);
    await waitForClose(child);
  })).finally(() => {
    process.exit(process.exitCode ?? 0);
  });

  return shutdownPromise;
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});
