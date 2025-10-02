import { fetchAllGeneDataJson } from "../API/fetchGeneDataJson";
import type { workerPostMessageType } from "../types/data_types_interfaces";

addEventListener(
  "message",
  async (event: MessageEvent<workerPostMessageType>) => {
    const meta_data = event.data.data_info;
    const species = event.data.species;
    const chromosome = event.data.chromosome;

    const gene_data = await fetchAllGeneDataJson({
      speciesName: species,
      chrName: chromosome,
      gene_data_folder: meta_data[species].gene_folder_name,
      dataInfo: meta_data,
    });
    console.log(gene_data);

    const gene_single_snapshopt = gene_data[
      `${chromosome}_${meta_data[species].timepoints[0]}_${meta_data[species].before_name}`
    ] as Array<{ gene_name: string }>;

    const gene_list = gene_single_snapshopt
      .map((d) => {
        return d.gene_name;
      })
      .sort();
    console.log(gene_list);

    postMessage({
      message: "Worker received message",
      fromClient: gene_data,
    });
  }
);
