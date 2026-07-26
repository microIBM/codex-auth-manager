import { createHash, randomBytes } from "node:crypto";

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

export function abortableDelay(ms: number, abortSignal?: AbortSignal): Promise<void> {
  throwIfAborted(abortSignal);
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
