import { findAllPaths } from "../utilities/creatingPaths";
import { fetchGeneNames } from "../utilities/calculateGeneIDs";
import { fetchBeadData } from "../API/readDataCsv";
import { createEdges } from "../utilities/createEdges";
import { fetchGencodeData } from "../API/readGencodeCsv";
import { fetchAccessibilityData } from "../API/readAccessibilityCsv";
import calculatePercentileValues from "../utilities/calculatePercentileValues";
import { calculateTubesForGeneWithAcc } from "../utilities/calculateTubesForGeneWithAcc";
import normalizePoistionCalculation from "../utilities/normalizePoistionCalculation";

addEventListener("message", async (event) => {
  let species = event.data.species;
  let chromosome = event.data.chromosome;
  let hour = event.data.hour;
  let meta_data = event.data.meta_data;

  console.log("Inside worker", species, chromosome, meta_data);
  // fetch bead data
  let before_atom_data_nodes = await fetchBeadData(
    species,
    chromosome,
    meta_data["before-name"],
    hour
  );

  let before_atom_data = {};

  // normalize the position of the beads
  before_atom_data.nodes = await normalizePoistionCalculation(
    before_atom_data_nodes,
    "coord"
  );

  //create edges and paths
  before_atom_data.edges = await createEdges(before_atom_data.nodes.length);
  before_atom_data.paths = await findAllPaths(before_atom_data.edges);

  // fetch gene data
  let before_gene_data = await fetchGencodeData(
    species,
    chromosome,
    meta_data["before-name"],
    hour
  );

  // fetch accessibility data
  let before_acc_data = await fetchAccessibilityData(
    species,
    chromosome,
    meta_data["before-name"],
    hour
  );

  // calculate the gene with accessibility
  let before_gene_with_acc = await calculateTubesForGeneWithAcc(
    before_gene_data,
    before_acc_data.data
  );

  let before_gene_names = await fetchGeneNames(before_gene_data);

  let after_atom_data_nodes = await fetchBeadData(
    species,
    chromosome,
    meta_data["after-name"],
    hour
  );

  let after_atom_data = {};
  after_atom_data.nodes = await normalizePoistionCalculation(
    after_atom_data_nodes,
    "coord"
  );
  after_atom_data.edges = await createEdges(after_atom_data.nodes.length);
  after_atom_data.paths = await findAllPaths(after_atom_data.edges);

  let after_gene_data = await fetchGencodeData(
    species,
    chromosome,
    meta_data["after-name"],
    hour
  );

  let after_acc_data = await fetchAccessibilityData(
    species,
    chromosome,
    meta_data["after-name"],
    hour
  );

  let after_gene_with_acc = await calculateTubesForGeneWithAcc(
    after_gene_data,
    after_acc_data.data
  );

  let after_gene_names = await fetchGeneNames(after_gene_data);

  let { percentile10, percentile90 } = await calculatePercentileValues(
    before_acc_data.data,
    after_acc_data.data
  );

  let before = {};
  before.atom_data = before_atom_data;
  before.gene_data = await normalizePoistionCalculation(
    before_gene_data,
    "middle_pos"
  );
  before.genes = before_gene_names;

  before.accessibility = {
    min: before_acc_data.min,
    max: before_acc_data.max,
    domain_min: Math.min(before_acc_data.min, after_acc_data.min),
    domain_max: Math.max(before_acc_data.max, after_acc_data.max),
    percentile10: percentile10,
    percentile90: percentile90,
    data: normalizePoistionCalculation(before_acc_data.data, "middle_pos"),
  };

  before.gene_with_acc = before_gene_with_acc;

  let after = {};
  after.atom_data = after_atom_data;
  after.gene_data = await normalizePoistionCalculation(
    after_gene_data,
    "middle_pos"
  );
  after.genes = after_gene_names;
  after.accessibility = {
    min: after_acc_data.min,
    max: after_acc_data.max,
    domain_min: Math.min(before_acc_data.min, after_acc_data.min),
    domain_max: Math.max(before_acc_data.max, after_acc_data.max),
    percentile10: percentile10,
    percentile90: percentile90,
    data: normalizePoistionCalculation(after_acc_data.data, "middle_pos"),
  };
  after.gene_with_acc = after_gene_with_acc;

  // console.log(before, after);

  postMessage({
    before_data: before,
    after_data: after,
  });
});
