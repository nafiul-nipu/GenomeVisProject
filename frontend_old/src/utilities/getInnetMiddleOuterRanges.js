export const getInnerMiddleOuterRanges = (maxVal) => {
  // Calculate the size of each group
  let groupSize = maxVal / 3;

  // Calculate the boundaries of the groups
  let innerStart = 0;
  let innerEnd = groupSize;
  let middleStart = groupSize;
  let middleEnd = 2 * groupSize;
  let outerStart = 2 * groupSize;
  let outerEnd = maxVal;

  // Construct the result object
  let groups = [
    { inner: [innerStart, innerEnd] },
    { middle: [middleStart, middleEnd] },
    { outer: [outerStart, outerEnd] },
  ];

  return groups;
};
