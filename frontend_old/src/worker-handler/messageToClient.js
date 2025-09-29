// handler for app receiving message from worker

export const message_to_client = (message, stateSetter, setAccRange) => {
  try {
    // console.log(message.data);
    stateSetter(message.data);
    setAccRange([
      Math.min(
        message.data.before_data.accessibility.min,
        message.data.after_data.accessibility.min
      ),
      Math.max(
        message.data.before_data.accessibility.max,
        message.data.after_data.accessibility.max
      ),
    ]);
  } catch (err) {
    console.log(`Error sending message to client: ${err}`);
  }
};
