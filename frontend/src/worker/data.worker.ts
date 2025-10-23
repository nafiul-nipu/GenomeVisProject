import { fetch2DContoursOrDensity } from "../API/fetch2DContourOrDensity";
import { fetch2DProjection } from "../API/fetch2DProjection";
import { fetchBackgroundMask } from "../API/fetchBackgroundMask";
import { fetchAllGeneDataJson } from "../API/fetchGeneDataJson";
import type {
  workerPostMessageType,
  GeneRowDataType,
  ContourWrapperType,
  Density2DType,
  BackgroundMask,
  ProjectionResult,
} from "../types/data_types_interfaces";

addEventListener(
  "message",
  async (event: MessageEvent<workerPostMessageType>) => {
    const requestId = event.data.requestId;
    const meta_data = event.data.data_info;
    const species = event.data.species;
    const chromosome = event.data.chromosome;

    // console.log("[worker] Received message:", {
    //   requestId,
    //   species,
    //   chromosome,
    // });

    // fetching gene data
    const gene_data: Record<string, GeneRowDataType[]> =
      await fetchAllGeneDataJson({
        speciesName: species,
        chrName: chromosome,
        gene_data_folder: meta_data[species].gene_folder_name,
        dataInfo: meta_data,
      });
    // console.log("gene data", gene_data);

    // getting gene list
    const gene_single_snapshopt: GeneRowDataType[] =
      gene_data[
        `${chromosome}_${meta_data[species].timepoints[0]}_${meta_data[species].before_name}`
      ] ?? [];

    const gene_list: string[] = gene_single_snapshopt
      .map((d) => {
        return d.gene_name;
      })
      .sort();
    // console.log(gene_list);

    const contour_data: Record<string, ContourWrapperType> =
      await fetch2DContoursOrDensity({
        speciesName: species,
        chrName: chromosome,
        dataInfo: meta_data,
        which2D: "contour",
      });

    // console.log("contour", contour_data);

    const density_data: Record<string, Density2DType> =
      await fetch2DContoursOrDensity({
        speciesName: species,
        chrName: chromosome,
        dataInfo: meta_data,
        which2D: "density",
      });

    // console.log("density", density_data);

    const projectionData: ProjectionResult = await fetch2DProjection({
      speciesName: species,
      chrName: chromosome,
    });

    // console.log("projection", projectionData);

    const backgroundMaskData: BackgroundMask = await fetchBackgroundMask({
      speciesName: species,
      chrName: chromosome,
    });

    // console.log("background mask", backgroundMaskData);

    postMessage({
      requestId,
      gene_data: gene_data,
      gene_list: gene_list,
      contour_data: contour_data,
      density_data: density_data,
      projectionData: projectionData,
      backgroundMaskData: backgroundMaskData,
    });
  }
);
