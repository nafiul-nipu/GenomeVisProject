export const messageToWorker = (workerRef: Worker | null, message: string) => {
  try {
    workerRef?.postMessage({ message });
  } catch (err) {
    console.error("Error in messageToWorker: ", err);
  }
};
