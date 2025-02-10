import axios from "axios";

export const fetchSimpleNetworkData = async (dataToFetch, model) => {
  console.log("axios data to fetch", dataToFetch);
  // console.log(process.env.PUBLIC_DATA_PATH)
  const cell = dataToFetch.split("_")[1];

  try {
    let url = `${
      import.meta.env.VITE_PUBLIC_DATA_PATH
    }${cell}/${dataToFetch}_model${model}_gene_info.json`;
    // console.log(url)
    let msg = await axios.get(url).then((response) => {
      // console.log("axios response", response)
      const result = response.data;
      // console.log(result)

      return result;
    });
    return msg;
  } catch (error) {
    console.log(error);
    return error;
  }
};
