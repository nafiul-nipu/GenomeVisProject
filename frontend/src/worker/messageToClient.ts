// utils/messageToClient.ts
import type React from "react";
import type { workerToClientMessageType } from "../types/data_types_interfaces";

export const messageToClient = (
  msg: workerToClientMessageType,
  setState: React.Dispatch<
    React.SetStateAction<workerToClientMessageType | null>
  >
) => {
  try {
    // optional sanity log
    // console.log("Worker payload keys:", Object.keys(msg ?? {}));
    setState(msg);
  } catch (err) {
    console.error("Error in messageToClient: ", err);
  }
};
