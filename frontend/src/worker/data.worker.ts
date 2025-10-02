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

    // console.log(gene_data);

    postMessage({
      message: "Worker received message",
      fromClient: gene_data,
    });
  }
);
