import type { workerPostMessageType } from "../types/worker_types";

addEventListener(
  "message",
  async (event: MessageEvent<workerPostMessageType>) => {
    const data: string = event.data.message;

    postMessage({
      message: "Worker received message",
      fromClient: data,
    });
  }
);
