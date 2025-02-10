export const getInnerMiddelOuterGroups = (data, ranges) => {
  let groupData = [{ inner: [] }, { middle: [] }, { outer: [] }];

  data.forEach((obj) => {
    let dis = obj.distance_from_com;

    // Determine which range the distance falls into
    if (dis >= ranges[0].inner[0] && dis < ranges[0].inner[1]) {
      groupData[0].inner.push(obj.name);
    } else if (dis >= ranges[1].middle[0] && dis < ranges[1].middle[1]) {
      groupData[1].middle.push(obj.name);
    } else if (dis >= ranges[2].outer[0] && dis <= ranges[2].outer[1]) {
      groupData[2].outer.push(obj.name);
    }
  });

  return groupData;
};
