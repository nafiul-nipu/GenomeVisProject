import type { workerToClientMessageType } from "../types/worker_types";

export const messageToClient = (
  message: workerToClientMessageType,
  stateSetter: (data: workerToClientMessageType["fromClient"]) => void
) => {
  try {
    console.log(message);
    if (message.fromClient !== undefined) {
      stateSetter(message.fromClient);
    }
  } catch (err) {
    console.error("Error in messageToClient: ", err);
  }
};
