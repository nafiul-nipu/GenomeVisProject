import axios from "axios";
import { csvParse } from "d3";

export const fetchAccessibilityData = async (
  dataToFetch,
  chromosome,
  fileIndicator,
  hour
) => {
  try {
    // let url = `${import.meta.env.VITE_PUBLIC_DATA_PATH}${dataToFetch}/accessibility-data/${state}/${chromosome}-${state}-accessibility-peaks-only.csv`;
    // console.log(url);
    let url = `${
      import.meta.env.VITE_PUBLIC_DATA_PATH
    }${dataToFetch}/${chromosome}/structure_${hour}_${fileIndicator}_accessibility-peaks-only.csv`;

    // if (dataToFetch === "green_monkey") {
    //   url = `${
    //     import.meta.env.VITE_PUBLIC_DATA_PATH
    //   }${dataToFetch}/${partURL}${chromosome}/structure/100kb/accessibility-peaks-only.csv`;
    //   // console.log(url);
    // } else {
    //   url = `${
    //     import.meta.env.VITE_PUBLIC_DATA_PATH
    //   }${dataToFetch}/${partURL}${chromosome}/accessibility-peaks-only.csv`;
    // }

    let response = await axios.get(url);

    let min = Infinity;
    let max = 0;

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

      // Find min and max values
      if (+d.value < min) {
        min = +d.value;
      }

      if (+d.value > max) {
        max = +d.value;
      }

      return d;
    });

    return {
      min: min,
      max: max,
      data: result,
    };
  } catch (error) {
    console.log(error);
    return error;
  }
};
