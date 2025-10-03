import axios from "axios";
import type {
  FetchDataType,
  ProjectionDataMap,
  ProjectionResult,
} from "../types/data_types_interfaces";

export const fetch2DProjection = async ({
  speciesName,
  chrName,
}: FetchDataType): Promise<ProjectionResult> => {
  try {
    const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;

    // Each plane has its own file
    const files = {
      XY: `${basePath}${speciesName}/shape_data/${chrName}/projections/XY_projections.json`,
      XZ: `${basePath}${speciesName}/shape_data/${chrName}/projections/XZ_projections.json`,
      YZ: `${basePath}${speciesName}/shape_data/${chrName}/projections/YZ_projections.json`,
    };

    // Fetch in parallel
    const [xy, xz, yz] = await Promise.allSettled([
      axios.get<ProjectionDataMap>(files.XY).then((r) => r.data),
      axios.get<ProjectionDataMap>(files.XZ).then((r) => r.data),
      axios.get<ProjectionDataMap>(files.YZ).then((r) => r.data),
    ]);

    return {
      XY: xy.status === "fulfilled" ? xy.value : {},
      XZ: xz.status === "fulfilled" ? xz.value : {},
      YZ: yz.status === "fulfilled" ? yz.value : {},
    };
  } catch (err) {
    console.error("Error in fetch2DProjection:", err);
    return { XY: {}, XZ: {}, YZ: {} };
  }
};
