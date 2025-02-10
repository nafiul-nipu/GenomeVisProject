// Function to calculate angles for each subset based on groups
export default function calculateSubsetGroupAngles(
  groups,
  subsets,
  changedGene
) {
  const result = [];
  for (let i = 0; i < groups.length; i++) {
    // console.log(i);
    const group = groups[i];
    const startAngle = group.startAngle;
    const endAngle = group.endAngle;

    const totalAngle = endAngle - startAngle;
    const angleIncrement = totalAngle / changedGene.length;

    let index = 0;
    subsets.forEach((subset, j) => {
      if (changedGene.includes(subset.subIndexName) && subset.index === i) {
        // console.log(`group ${i} index ${index}`);
        const start = startAngle + index * angleIncrement;
        const end = start + angleIncrement;
        result.push({
          name: subset.subIndexName,
          subsetIndex: subset.subIndex,
          index: subset.index,
          groupName: subset.groupName,
          startAngle: start,
          endAngle: end,
          value: subset.value,
          state: subset.state,
        });

        index++;
      }
    });
  }

  return result;
}
