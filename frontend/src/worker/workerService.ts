/**
 * workerService.ts
 *
 * A tiny, type-safe request/response bridge to a single Web Worker.
 * - Supports multiple in-flight requests using requestId correlation.
 * - Handles both "new" ({ ok, payload }) and "old" (entire object as payload) reply shapes.
 * - Adds a timeout per request for robustness.
 *
 * Usage:
 *   const res = await requestData(data_info, species, chromosome);
 *   // res is workerToClientMessageType
 */

import type {
  DataInfoType,
  workerToClientMessageType,
} from "../types/data_types_interfaces";

// In-flight request record kept in the `pending` map.
type PendingEntry = {
  resolve: (v: workerToClientMessageType) => void;
  reject: (e: unknown) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
};

//  Singleton worker instance.
let worker: Worker | null = null;

// Tracks promises waiting for worker responses by requestId.
const pending = new Map<string, PendingEntry>();

//Type guards for evt.data (keeps us ESLint/TS-clean)
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasRequestId = (v: unknown): v is { requestId: string } =>
  isObject(v) && typeof v.requestId === "string";

// success: { requestId, ok: true, payload }
const isOkShape = (
  v: unknown
): v is { requestId: string; ok: true; payload: workerToClientMessageType } =>
  hasRequestId(v) &&
  (v as Record<string, unknown>).ok === true &&
  "payload" in v;

// error: { requestId, ok: false, error? }
const isErrShape = (
  v: unknown
): v is { requestId: string; ok: false; error?: unknown } =>
  hasRequestId(v) && (v as Record<string, unknown>).ok === false;

// Attach message/error listeners exactly once
export const addWorkerKeyListeners = (w: Worker) => {
  // Route worker to main responses by requestId
  w.addEventListener("message", (evt: MessageEvent<unknown>) => {
    const data = evt.data;

    // Ignore messages that don't carry a requestId (not an RPC reply)
    if (!hasRequestId(data)) return;

    const entry = pending.get(data.requestId);
    if (!entry) return; // Not a pending request (e.g., already timed out)

    // This reply is consumed; clear timeout and remove from map
    pending.delete(data.requestId);
    if (entry.timeoutId) clearTimeout(entry.timeoutId);

    // New schema with ok=true/false
    if (isOkShape(data)) {
      entry.resolve(data.payload);
      return;
    }
    if (isErrShape(data)) {
      const err =
        data.error instanceof Error
          ? data.error
          : new Error("Worker returned error", { cause: data.error });
      entry.reject(err);
      return;
    }

    // Old schema: treat entire message as the payload (still has requestId)
    entry.resolve(data as unknown as workerToClientMessageType);
  });

  // Fatal worker error: reject all in-flight requests
  w.addEventListener("error", (err: ErrorEvent) => {
    for (const [, entry] of pending) {
      if (entry.timeoutId) clearTimeout(entry.timeoutId);
      entry.reject(new Error("Worker crashed", { cause: err }));
    }
    pending.clear();
  });
};

// create worker
export const ensureWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL("./data.worker.ts", import.meta.url), {
      type: "module",
    });
    // Attach our router listeners once
    addWorkerKeyListeners(worker);
  }
  return worker;
};

// Simple UUID generator for request IDs
// creates unique IDs like '3f9d5b7e-8c4a-4e2a-9f1e-2b6d9f4c5a1b'
const uuid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

//Public API: post a request to worker and await its response
/**
 * Sends a request to the Web Worker and resolves when the *matching* reply arrives.
 *
 * @param data_info  app meta info to guide worker fetching
 * @param species    e.g., "green_monkey"
 * @param chromosome e.g., "chr1"
 * @param opts.timeoutMs  per-request timeout (default: 15000ms)
 * @returns Promise resolving to your app's worker payload type
 */
export const requestData = (
  data_info: DataInfoType,
  species: string,
  chromosome: string,
  opts: { timeoutMs?: number } = {}
): Promise<workerToClientMessageType> => {
  const w = ensureWorker();
  const requestId = uuid();
  const timeoutMs = opts.timeoutMs ?? 15000;

  return new Promise((resolve, reject) => {
    // Set up a safety timeout
    const timeoutId = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Worker request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // Track this request until a matching reply arrives
    pending.set(requestId, { resolve, reject, timeoutId });

    try {
      // Send the request (worker must echo requestId in its postMessage)
      // can add `op: "FETCH_GENE_DATA"` later if you multiplex operations.
      w.postMessage({
        requestId,
        data_info,
        species,
        chromosome,
      });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      pending.delete(requestId);
      reject(err);
    }
  });
};

// Terminate the worker and clear pending requests
export const terminateWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    // Fail all in-flight requests to prevent forever-pending Promises
    for (const [, entry] of pending) {
      if (entry.timeoutId) clearTimeout(entry.timeoutId);
      entry.reject(new Error("Worker terminated"));
    }
    pending.clear();
  }
};
