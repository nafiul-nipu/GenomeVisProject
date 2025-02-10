export default function createGeneNetwork(changedGenes, angledata) {
  let links = [];

  for (let genes of changedGenes) {
    const geneAngles = angledata.filter((angle) => angle.name === genes);
    let first = geneAngles[0];
    // console.log(source);
    let second = geneAngles[1];
    let link = {
      source: first.state === "before" ? first : second,
      target: second.state === "after" ? second : first,
    };
    links.push(link);
  }

  return links;
}
