import axios from "axios";
import type {
  SpeciesInfoRaw,
  FetchDataType,
  GeneRowDataType,
} from "../types/data_types_interfaces";

export const fetchAllGeneDataJson = async ({
  speciesName,
  chrName,
  gene_data_folder,
  dataInfo,
}: FetchDataType): Promise<Record<string, GeneRowDataType[]>> => {
  try {
    if (!dataInfo) {
      throw new Error("dataInfo is required");
    }

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
      urls.map((url) =>
        axios.get<GeneRowDataType[]>(url).then((res) => res.data)
      )
    );

    // Return an object keyed by filename (only successes)
    const out: Record<string, GeneRowDataType[]> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        const cleanKey = fileNames[i].replace(`_${geneFileTail}.json`, ""); // e.g., chr1_12hrs_untr
        out[cleanKey] = r.value; // typed as GeneRowDataType[]
      }
    });

    return out;
  } catch (error) {
    console.error("Error fetching gene data:", error);
    return {};
  }
};
