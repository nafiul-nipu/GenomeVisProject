// Function to populate adjacency matrix based on beforeGroup and afterGroup
export const innerMiddleOuterAdjacencyMatrix = (beforeGroup, afterGroup) => {
  // Initialize adjacency matrix with zeros
  let adjacencyMatrix = [
    [0, 0, 0], // Inner to Inner, Inner to Middle, Inner to Outer
    [0, 0, 0], // Middle to Inner, Middle to Middle, Middle to Outer
    [0, 0, 0], // Outer to Inner, Outer to Middle, Outer to Outer
  ];

  // Iterate over each group combination (inner, middle, outer)
  ["inner", "middle", "outer"].forEach((group1, index1) => {
    ["inner", "middle", "outer"].forEach((group2, index2) => {
      // Get arrays of names for current group combination
      let group1Names =
        beforeGroup.find((entry) => entry[group1])?.[group1] || [];

      //   console.log(group1, group1Names);
      let group2Names =
        afterGroup.find((entry) => entry[group2])?.[group2] || [];

      //   console.log(group2, group2Names);

      // Calculate intersection size (number of shared names)
      let intersectionSize = group1Names.filter((name) =>
        group2Names.includes(name)
      ).length;

      // Update adjacency matrix
      adjacencyMatrix[index1][index2] = intersectionSize;
    });
  });

  return adjacencyMatrix;
};
