import { createHash, randomBytes } from "node:crypto";
import { setMaxListeners } from "node:events";

const DEFAULT_ABORT_SIGNAL_MAX_LISTENERS = 0;

export function randomUrlSafeString(length: number): string {
  const size = length > 0 ? length : 32;
  return randomBytes(size).toString("base64url");
}

export function pkceCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function createAbortError(): Error {
  return new Error("Job cancelled");
}

export function throwIfAborted(abortSignal?: AbortSignal): void {
  if (abortSignal?.aborted) {
    throw createAbortError();
  }
}

export function allowManyAbortListeners(
  abortSignal?: AbortSignal,
  maxListeners = DEFAULT_ABORT_SIGNAL_MAX_LISTENERS,
): void {
  if (!abortSignal) {
    return;
  }
  try {
    setMaxListeners(maxListeners, abortSignal);
  } catch {
    // Older runtimes may not support EventTarget here; cancellation still works.
  }
}

export function abortableDelay(ms: number, abortSignal?: AbortSignal): Promise<void> {
  throwIfAborted(abortSignal);
  allowManyAbortListeners(abortSignal);
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", onAbort);
      }
    };
    const onAbort = () => {
      if (timer) {
        clearTimeout(timer);
      }
      cleanup();
      reject(createAbortError());
    };

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    abortSignal?.addEventListener("abort", onAbort, {once: true});
    if (abortSignal?.aborted) {
      onAbort();
    }
  });
}
