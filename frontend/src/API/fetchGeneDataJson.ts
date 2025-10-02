import axios from "axios";
import type {
  DataInfoType,
  SpeciesInfoRaw,
} from "../types/data_types_interfaces";

interface GeneData {
  speciesName: string;
  chrName: string;
  gene_data_folder: string;
  dataInfo: DataInfoType;
}

export const fetchAllGeneDataJson = async ({
  speciesName,
  chrName,
  gene_data_folder,
  dataInfo,
}: GeneData): Promise<Record<string, unknown>> => {
  try {
    const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;
    // console.log(basePath);

    const cfg: SpeciesInfoRaw = dataInfo[speciesName];
    if (!cfg) {
      throw new Error(`Species "${speciesName}" not found in dataInfo.`);
    }
    const timepoints: string[] = cfg.timepoints;
    const conditions: string[] = [cfg.before_name, cfg.after_name];
    const geneFileTail: string = cfg.gene_file_tail;

    const fileNames: string[] = [];
    for (const tp of timepoints) {
      for (const cond of conditions) {
        fileNames.push(`${chrName}_${tp}_${cond}_${geneFileTail}.json`);
      }
    }

    // console.log(fileNames[1]);

    // Create full URLs for each file
    const urls = fileNames.map(
      (file) =>
        `${basePath}${speciesName}/${gene_data_folder}/${chrName}/${file}`
    );
    // console.log(urls[1]);

    // Fetch all files in parallel; skip missing files silently
    const settled = await Promise.allSettled(
      urls.map((url) => axios.get(url).then((res) => res.data as unknown))
    );

    // Return an object keyed by filename (only successes)
    const out: Record<string, unknown> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") {
        // remove "_gene_aligned.json" (or whatever the tail is) from key
        const cleanKey = fileNames[i].replace(`_${geneFileTail}.json`, "");
        out[cleanKey] = r.value;
      }
    });

    return out;
  } catch (error) {
    console.error("Error fetching gene data:", error);
    return {};
  }
};
