import { findAllPaths } from "../utilities/creatingPaths";
import { fetchGeneNames } from "../utilities/calculateGeneIDs";
import { fetchBeadData } from "../API/readDataCsv";
import { createEdges } from "../utilities/createEdges";
import { fetchGencodeData } from "../API/readGencodeCsv";
import { fetchAccessibilityData } from "../API/readAccessibilityCsv";
import calculatePercentileValues from "../utilities/calculatePercentileValues";
import { calculateTubesForGeneWithAcc } from "../utilities/calculateTubesForGeneWithAcc";

addEventListener("message", async (event) => {
  let species = event.data.species;
  let chromosome = event.data.chromosome;
  let meta_data = event.data.meta_data;

  // console.log("Inside worker", species, chromosome, meta_data);

  let before_atom_data = {};
  before_atom_data.nodes = await fetchBeadData(
    species,
    chromosome,
    meta_data["before_url"]
  );
  // console.log(before.nodes);

  before_atom_data.edges = await createEdges(before_atom_data.nodes.length);
  before_atom_data.paths = await findAllPaths(before_atom_data.edges);

  let before = {};
  before.atom_data = before_atom_data;

  before.gene_data = await fetchGencodeData(
    species,
    chromosome,
    meta_data["before_url"]
  );

  before.genes = await fetchGeneNames(before.gene_data);

  let before_acc = await fetchAccessibilityData(
    species,
    chromosome,
    meta_data["before_url"]
  );
  // console.log(before_acc.min, before_acc.max, before_acc.data);

  before.gene_with_acc = await calculateTubesForGeneWithAcc(
    before.gene_data,
    before_acc.data
  );

  let after_atom_data = {};
  after_atom_data.nodes = await fetchBeadData(
    species,
    chromosome,
    meta_data["after_url"]
  );

  after_atom_data.edges = await createEdges(after_atom_data.nodes.length);
  after_atom_data.paths = await findAllPaths(after_atom_data.edges);

  let after = {};
  after.atom_data = after_atom_data;

  after.gene_data = await fetchGencodeData(
    species,
    chromosome,
    meta_data["after_url"]
  );

  after.genes = await fetchGeneNames(after.gene_data);

  let after_acc = await fetchAccessibilityData(
    species,
    chromosome,
    meta_data["after_url"]
  );
  // console.log(after_acc.min, after_acc.max, after_acc.data);

  after.gene_with_acc = await calculateTubesForGeneWithAcc(
    after.gene_data,
    after_acc.data
  );

  let { percentile10, percentile90 } = await calculatePercentileValues(
    before_acc.data,
    after_acc.data
  );

  // console.log(percentile10, percentile90);

  before.accessibility = {
    min: before_acc.min,
    max: before_acc.max,
    domain_min: Math.min(before_acc.min, after_acc.min),
    domain_max: Math.max(before_acc.max, after_acc.max),
    percentile10: percentile10,
    percentile90: percentile90,
    data: before_acc.data,
  };

  after.accessibility = {
    min: after_acc.min,
    max: after_acc.max,
    domain_min: Math.min(before_acc.min, after_acc.min),
    domain_max: Math.max(before_acc.max, after_acc.max),
    percentile10: percentile10,
    percentile90: percentile90,
    data: after_acc.data,
  };

  postMessage({
    before_data: before,
    after_data: after,
  });
});
