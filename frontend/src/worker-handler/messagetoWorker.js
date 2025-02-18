export const message_to_worker = (
  workerRef,
  species,
  chromosome,
  hour,
  meta_data
) => {
  try {
    // console.log(meesageType, layoutType, chromosome, metadata)
    workerRef.postMessage({ species, chromosome, hour, meta_data });
  } catch (err) {
    console.log(`Error sending message to worker: ${err}`);
  }
};
