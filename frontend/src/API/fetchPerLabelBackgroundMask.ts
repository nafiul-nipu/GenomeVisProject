import axios from "axios";
import type {
  FetchDataType,
  BackgroundMask,
  MaskMatrix,
  SpeciesInfoRaw,
  PerLabelBackgroundMask,
} from "../types/data_types_interfaces";

function isMaskMatrix(m: unknown): m is MaskMatrix {
  return (
    Array.isArray(m) &&
    m.every(
      (row) =>
        Array.isArray(row) && row.every((cell) => typeof cell === "number")
    )
  );
}

export const fetchPerLabelBackgroundMask = async ({
  speciesName,
  chrName,
  dataInfo,
}: FetchDataType): Promise<PerLabelBackgroundMask> => {
  try {
    if (!dataInfo) throw new Error("dataInfo is required");

    const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;
    const cfg: SpeciesInfoRaw = dataInfo[speciesName];
    if (!cfg)
      throw new Error(`Species "${speciesName}" not found in dataInfo.`);

    const timepoints: string[] = cfg.timepoints;
    const conditions: string[] = [cfg.before_name, cfg.after_name];

    // build filenames like chr1_12hrs_untr_background.json
    const fileNames: string[] = [];
    for (const tp of timepoints) {
      for (const cond of conditions) {
        fileNames.push(`${chrName}_${tp}_${cond}_background.json`);
      }
    }

    // build URLs
    const urls = fileNames.map(
      (file) =>
        `${basePath}${speciesName}/shape_data/${chrName}/background_by_label/${file}`
    );

    // fetch in parallel
    const settled = await Promise.allSettled(
      urls.map((url) =>
        axios.get<Partial<BackgroundMask>>(url).then((r) => r.data)
      )
    );

    // collect only successes
    const out: Record<string, BackgroundMask> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const data = r.value;
        const XY = isMaskMatrix(data?.XY) ? data!.XY : [];
        const XZ = isMaskMatrix(data?.XZ) ? data!.XZ : [];
        const YZ = isMaskMatrix(data?.YZ) ? data!.YZ : [];
        const cleanKey = fileNames[i].replace("_background.json", ""); // e.g., chr1_12hrs_untr
        out[cleanKey] = { XY, XZ, YZ };
      }
    });

    return out;
  } catch (error) {
    console.error("Error fetching background masks:", error);
    return {};
  }
};
