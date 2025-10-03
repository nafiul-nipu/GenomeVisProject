import { fetch2DContoursOrDensity } from "../API/fetch2DContourOrDensity";
import { fetch2DProjection } from "../API/fetch2DProjection";
import { fetchBackgroundMask } from "../API/fetchBackgroundMask";
import { fetchAllGeneDataJson } from "../API/fetchGeneDataJson";
import type { workerPostMessageType } from "../types/data_types_interfaces";

addEventListener(
  "message",
  async (event: MessageEvent<workerPostMessageType>) => {
    const meta_data = event.data.data_info;
    const species = event.data.species;
    const chromosome = event.data.chromosome;

    // fetching gene data
    const gene_data = await fetchAllGeneDataJson({
      speciesName: species,
      chrName: chromosome,
      gene_data_folder: meta_data[species].gene_folder_name,
      dataInfo: meta_data,
    });
    console.log("gene data", gene_data);

    // getting gene list
    const gene_single_snapshopt =
      gene_data[
        `${chromosome}_${meta_data[species].timepoints[0]}_${meta_data[species].before_name}`
      ];

    const gene_list = gene_single_snapshopt
      .map((d) => {
        return d.gene_name;
      })
      .sort();
    console.log(gene_list);

    const contour_data = await fetch2DContoursOrDensity({
      speciesName: species,
      chrName: chromosome,
      dataInfo: meta_data,
      which2D: "contour",
    });

    console.log("contour", contour_data);

    const density_data = await fetch2DContoursOrDensity({
      speciesName: species,
      chrName: chromosome,
      dataInfo: meta_data,
      which2D: "density",
    });

    console.log("density", density_data);

    const projectionData = await fetch2DProjection({
      speciesName: species,
      chrName: chromosome,
    });

    console.log("projection", projectionData);

    const backgroundMaskData = await fetchBackgroundMask({
      speciesName: species,
      chrName: chromosome,
    });

    console.log("background mask", backgroundMaskData);

    postMessage({
      message: "Worker received message",
      fromClient: gene_data,
    });
  }
);
