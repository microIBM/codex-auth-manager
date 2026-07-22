export const DEFAULT_REGISTRATION_CONCURRENCY = 8;

export interface RegistrationRoundOutcome<T> {
  index: number;
  result?: T;
  error?: unknown;
}

export interface RegistrationRoundContext {
  workerId: number;
  threadLabel: string;
}

export interface ConcurrentRegistrationRoundsOptions<T> {
  totalRounds: number;
  concurrency?: unknown;
  waitBetweenRoundsMs?: number;
  shouldCancel?: () => boolean;
  abortOnError?: (error: unknown) => boolean;
  runRound: (index: number, context: RegistrationRoundContext) => Promise<T>;
}

export function resolveRegistrationConcurrency(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_REGISTRATION_CONCURRENCY;
  }
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return DEFAULT_REGISTRATION_CONCURRENCY;
  }
  return Math.max(1, parsed);
}

export async function runConcurrentRegistrationRounds<T>({
  totalRounds,
  concurrency,
  waitBetweenRoundsMs = 0,
  shouldCancel,
  abortOnError,
  runRound,
}: ConcurrentRegistrationRoundsOptions<T>): Promise<Array<RegistrationRoundOutcome<T>>> {
  const normalizedTotal = Math.max(0, Math.floor(totalRounds));
  if (!normalizedTotal) {
    return [];
  }

  const normalizedConcurrency = Math.min(resolveRegistrationConcurrency(concurrency), normalizedTotal);
  const outcomes = new Array<RegistrationRoundOutcome<T>>(normalizedTotal);
  let nextIndex = 0;
  let abortError: unknown;

  async function worker(workerId: number): Promise<void> {
    const context = {
      workerId,
      threadLabel: `线程 ${workerId}`,
    };
    while (true) {
      if (abortError || shouldCancel?.()) {
        return;
      }
      const index = nextIndex;
      nextIndex += 1;
      if (index >= normalizedTotal) {
        return;
      }

      try {
        outcomes[index] = {index, result: await runRound(index, context)};
      } catch (error) {
        if (abortOnError?.(error)) {
          abortError = error;
          return;
        }
        outcomes[index] = {index, error};
      }

      if (waitBetweenRoundsMs > 0 && nextIndex < normalizedTotal) {
        await waitForNextRound(waitBetweenRoundsMs, shouldCancel);
      }
    }
  }

  await Promise.all(Array.from({length: normalizedConcurrency}, (_item, index) => worker(index + 1)));
  if (abortError) {
    throw abortError;
  }
  return outcomes.filter(Boolean);
}

async function waitForNextRound(delayMs: number, shouldCancel?: () => boolean): Promise<void> {
  const deadline = Date.now() + Math.max(0, Math.floor(delayMs));
  while (Date.now() < deadline) {
    if (shouldCancel?.()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000, deadline - Date.now())));
  }
}
