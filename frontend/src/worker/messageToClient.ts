import type { workerToClientMessageType } from "../types/data_types_interfaces";

export const messageToClient = (
  message: workerToClientMessageType,
  stateSetter: (data: workerToClientMessageType["fromClient"]) => void
) => {
  try {
    console.log(message.message);
    if (message.fromClient !== undefined) {
      stateSetter(message.fromClient);
    }
  } catch (err) {
    console.error("Error in messageToClient: ", err);
  }
};
