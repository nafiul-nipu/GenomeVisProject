import * as ss from "simple-statistics";

// merge the two data and calculate 10th and 90th percentile values
export default async function calculatePercentileValues(data1, data2) {
  //   console.log(data1, data2);
  let array1 = data1.map((d) => d.value);
  let array2 = data2.map((d) => d.value);

  let mergedArray = array1.concat(array2);

  let percentile10 = ss.quantile(mergedArray, 0.1);
  let percentile90 = ss.quantile(mergedArray, 0.9);

  return { percentile10, percentile90 };
}
