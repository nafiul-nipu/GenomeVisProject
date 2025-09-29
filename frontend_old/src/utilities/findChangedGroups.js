// Function to find changed groups
export default function findChangedGroups(before, after) {
  const changedValues = [];

  before.forEach((group, i) => {
    const groupName = Object.keys(group)[0];
    let array = after[i][groupName];

    group[groupName].forEach((gene) => {
      if (!array.includes(gene)) {
        changedValues.push(gene);
        // console.log(groupName, gene);
      }
    });
  });

  return changedValues;
}
