import axios from "axios";
import { autoType, csvParse } from "d3";

export const fetchBeadData = async (dataToFetch, chromosome, partURL) => {
  try {
    // console.log(dataToFetch);
    // console.log(chromosome);
    // console.log(partURL);
    let url;
    if (dataToFetch === "green_monkey") {
      url = `${
        import.meta.env.VITE_PUBLIC_DATA_PATH
      }${dataToFetch}/${partURL}${chromosome}/structure/100kb/structure-with-tracks.csv`;
      // console.log(url);
    } else {
      url = `${
        import.meta.env.VITE_PUBLIC_DATA_PATH
      }${dataToFetch}/${partURL}${chromosome}/structure.csv`;
    }

    // console.log(url);

    let response = await axios.get(url);

    // Parse CSV data with automatic type conversion using autoType
    const result = csvParse(response.data, autoType);

    // Additional transformations or data manipulations
    const dataWithCoord = result.map((obj) => {
      // Assuming x, y, z are numeric fields, convert them to numbers
      obj.x = +obj.x;
      obj.y = +obj.y;
      obj.z = +obj.z;

      // Add coord=[x, y, z] to each object
      obj.coord = [obj.x, obj.y, obj.z];

      // Handle any other dynamic data conversions or manipulations here
      // Example: Convert stringified arrays to actual arrays
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "string") {
          try {
            obj[key] = JSON.parse(obj[key]);

            // eslint-disable-next-line no-unused-vars
          } catch (error) {
            // If parsing as JSON fails, keep it as a string
            // console.log(error);
          }
        }
      });

      return obj;
    });

    return dataWithCoord;
  } catch (error) {
    console.log(error);
    return error;
  }
};
