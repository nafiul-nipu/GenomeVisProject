export default function createGroupSubset(group, names) {
  // console.log(group);
  let subset = [];
  const keys = Object.keys(group);
  // console.log(keys);
  keys.forEach((key, i) => {
    group[key].forEach((s, j) => {
      subset.push({
        groupName: key,
        index: i,
        subIndex: j,
        subIndexName: s.name,
        state: s.state,
        value: 1,
      });
    });
  });
  return subset;
}
