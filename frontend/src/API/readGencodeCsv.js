import axios from "axios";
import { csvParse } from "d3";

export const fetchGencodeData = async (dataToFetch, chromosome, partURL) => {
  try {
    // let url = `${import.meta.env.VITE_PUBLIC_DATA_PATH}${dataToFetch}/gencode-data/${state}/${chromosome}-${state}-gene-info.csv`;
    let url;
    if (dataToFetch === "green_monkey") {
      url = `${
        import.meta.env.VITE_PUBLIC_DATA_PATH
      }${dataToFetch}/${partURL}${chromosome}/structure/100kb/gene-info.csv`;
      // console.log(url);
    } else {
      url = `${
        import.meta.env.VITE_PUBLIC_DATA_PATH
      }${dataToFetch}/${partURL}${chromosome}/gene-info.csv`;
    }

    // console.log(url);
    let response = await axios.get(url);

    // Parse CSV data with custom type conversion
    const result = csvParse(response.data, (d) => {
      // Iterate through each property of the object
      Object.keys(d).forEach((key) => {
        // Attempt to parse each property to a number
        let numValue = +d[key];
        if (!isNaN(numValue)) {
          // If parsing successful, assign the parsed value back to the object
          d[key] = numValue;
        } else {
          // Attempt to parse as JSON if it's a stringified array/object
          try {
            d[key] = JSON.parse(d[key]);

            // eslint-disable-next-line no-unused-vars
          } catch (error) {
            // If parsing fails, leave it as is (likely a string)
            // console.log(error);
          }
        }
      });

      return d;
    });

    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};
