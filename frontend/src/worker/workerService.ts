import type {
  DataInfoType,
  workerToClientMessageType,
} from "../types/data_types_interfaces";

let worker: Worker | null = null;

export const ensureWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL("./data.worker.ts", import.meta.url), {
      type: "module",
    });
  }

  return worker;
};

/**
 * One-shot request = response helper.
 * Posts (data_info, species, chromosome) to the worker and resolves
 * the next message as `workerToClientMessageType`.
 */

export const requestData = (
  data_info: DataInfoType,
  species: string,
  chromosome: string
): Promise<workerToClientMessageType> => {
  const w = ensureWorker();

  return new Promise((resolve, reject) => {
    const handleMessage = (evt: MessageEvent) => {
      w.removeEventListener("message", handleMessage);
      resolve(evt.data as workerToClientMessageType);
    };

    const handleError = (err: ErrorEvent) => {
      w.removeEventListener("error", handleError);
      reject(err);
    };

    w.addEventListener("message", handleMessage, { once: true });
    w.addEventListener("error", handleError, { once: true });

    try {
      w.postMessage({ data_info, species, chromosome });
    } catch (err) {
      // clean up
      w.removeEventListener("message", handleMessage);
      w.removeEventListener("error", handleError);
      reject(err);
    }
  });
};

//  dispose
export const terminateWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
};
