export async function fetchGeneNames(data) {
  const genes = data.map((d) => ({ value: d.name }));
  return genes;
}
