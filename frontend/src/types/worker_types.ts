export interface workerPostMessageType {
  message: string;
}

export interface workerToClientMessageType {
  message: string;
  fromClient?: unknown;
}

export interface messageToWorkerType {
  workerRef: Worker | null;
  message: string;
}
