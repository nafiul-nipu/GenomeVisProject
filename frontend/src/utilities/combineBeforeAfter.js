// export default function combineBeforeAfter(before, after) {
//   let combined = {};
//   before.forEach((group, i) => {
//     const groupName = Object.keys(group)[0];
//     let array = [...group[groupName], ...after[i][groupName]];
//     combined[groupName] = array;
//   });

//   return combined;
// }

export default function combineBeforeAfter(before, after) {
  //   console.log(before);
  let combined = {};
  before.forEach((group, i) => {
    const groupName = Object.keys(group)[0];
    // const addBeforeAttribute = group
    // let array = [...group[groupName], ...after[i][groupName]];
    const beforeObj = group[groupName].map((gene) => ({
      name: gene,
      state: "before",
    }));
    const afterObj = after[i][groupName].map((gene) => ({
      name: gene,
      state: "after",
    }));

    const arrayObj = [...beforeObj, ...afterObj];
    combined[groupName] = arrayObj;
  });

  return combined;
}
