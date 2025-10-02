import type { messageToWorkerType } from "../types/data_types_interfaces";
export const messageToWorker = ({
  workerRef,
  data_info,
  species,
  chromosome,
}: messageToWorkerType) => {
  try {
    workerRef?.postMessage({ data_info, species, chromosome });
  } catch (err) {
    console.error("Error in messageToWorker: ", err);
  }
};
