import axios from "axios";
import type {
  FetchDataType,
  BackgroundMask,
  MaskMatrix,
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

export const fetchBackgroundMask = async ({
  speciesName,
  chrName,
}: FetchDataType): Promise<BackgroundMask> => {
  try {
    const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;

    // assuming it lives alongside projections
    const url = `${basePath}${speciesName}/shape_data/${chrName}/background_mask.json`;

    const data = await axios
      .get<Partial<BackgroundMask>>(url)
      .then((r) => r.data);

    // normalize + runtime guard
    const XY = isMaskMatrix(data?.XY) ? data!.XY : [];
    const XZ = isMaskMatrix(data?.XZ) ? data!.XZ : [];
    const YZ = isMaskMatrix(data?.YZ) ? data!.YZ : [];

    return { XY, XZ, YZ };
  } catch (err) {
    console.error("Error in fetchBackgroundMask:", err);
    return { XY: [], XZ: [], YZ: [] };
  }
};
