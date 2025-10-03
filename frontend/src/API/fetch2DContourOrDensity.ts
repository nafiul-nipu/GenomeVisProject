import axios from "axios";
import type {
  SpeciesInfoRaw,
  FetchDataType,
  ContourWrapperType,
  Density2DType,
} from "../types/data_types_interfaces";

// Overload 1: contour
export async function fetch2DContoursOrDensity(
  args: FetchDataType & { which2D: "contour" }
): Promise<Record<string, ContourWrapperType>>;

// Overload 2: density
export async function fetch2DContoursOrDensity(
  args: FetchDataType & { which2D: "density" }
): Promise<Record<string, Density2DType>>;

// Single implementation (note: union return; no 'any')
export async function fetch2DContoursOrDensity({
  speciesName,
  chrName,
  dataInfo,
  which2D,
}: FetchDataType): Promise<Record<string, ContourWrapperType | Density2DType>> {
  try {
    if (!dataInfo) throw new Error("dataInfo is required");
    if (!which2D) throw new Error("which2D must be 'contour' or 'density'");

    const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;
    const cfg: SpeciesInfoRaw = dataInfo[speciesName];
    if (!cfg)
      throw new Error(`Species "${speciesName}" not found in dataInfo.`);

    const timepoints = cfg.timepoints;
    const conditions = [cfg.before_name, cfg.after_name];

    const fileNames: string[] = [];
    for (const tp of timepoints) {
      for (const cond of conditions) {
        fileNames.push(`${chrName}_${tp}_${cond}_${which2D}.json`);
      }
    }

    const urls = fileNames.map(
      (file) =>
        `${basePath}${speciesName}/shape_data/${chrName}/${which2D}/${file}`
    );

    const out: Record<string, ContourWrapperType | Density2DType> = {};

    if (which2D === "contour") {
      const settled = await Promise.allSettled(
        urls.map((u) => axios.get<ContourWrapperType>(u).then((r) => r.data))
      );
      settled.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const cleanKey = fileNames[i].replace(`_${which2D}.json`, "");
          out[cleanKey] = r.value; // ContourWrapperType
        }
      });
    } else {
      const settled = await Promise.allSettled(
        urls.map((u) => axios.get<Density2DType>(u).then((r) => r.data))
      );
      settled.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const cleanKey = fileNames[i].replace(`_${which2D}.json`, "");
          out[cleanKey] = r.value; // Density2DType
        }
      });
    }

    return out;
  } catch (error) {
    console.error("Error fetching 2D contour or density data:", error);
    return {};
  }
}
