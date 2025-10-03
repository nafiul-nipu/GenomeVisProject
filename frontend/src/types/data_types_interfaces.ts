export interface SpeciesInfoRaw {
  chromosomes: string[];
  timepoints: string[];
  resolution: number;
  before_name: string;
  after_name: string;
  gene_folder_name: string;
  gene_file_tail: string;
}

export type DataInfoType = {
  [speciesId: string]: SpeciesInfoRaw;
};

export interface ChromosomeDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
}

export interface SpeciesDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
  setChromosome: (chr: string) => void;
  meta_data: DataInfoType;
}

export interface workerPostMessageType {
  data_info: DataInfoType;
  species: string;
  chromosome: string;
}

export interface workerToClientMessageType {
  message: string;
  fromClient?: unknown;
}

export interface messageToWorkerType {
  workerRef: Worker | null;
  data_info: DataInfoType;
  species: string;
  chromosome: string;
}

export interface FetchDataType {
  speciesName: string;
  chrName: string;
  gene_data_folder?: string;
  dataInfo?: DataInfoType;
  which2D?: "contour" | "density";
}

export interface GeneRowDataType {
  aligned_pos: number[];
  chromosome: string;
  chromosome_nc: string;
  cluster: number;
  end: number;
  end_pos: string;
  end_x: number;
  end_y: number;
  end_z: number;
  gene_id: string;
  gene_name: string;
  middle: number;
  middle_percent: number;
  middle_pos: string;
  middle_x: number;
  middle_y: number;
  middle_z: number;
  start: number;
  start_pos: string;
  start_x: number;
  start_y: number;
  start_z: number;
  structure_end_id: number;
  structure_start_id: number;
}

export type Point2D = [number, number];
export interface Contour2DType {
  label: string; // e.g., "chr1_12hrs_untr"
  level: number; // contour level (100, 99, ...)
  plane: string; // "XY", "YZ", "XZ"
  points: Point2D[]; // array of 2D points
  variant: string; // e.g., "hdr"
}

export interface ContourWrapperType {
  contours: Contour2DType[];
}

export type DensityMatrix = number[][]; // 2D array of density values
export interface Density2DType {
  XY: DensityMatrix;
  YZ: DensityMatrix;
  XZ: DensityMatrix;
}

export type ProjectionPoint = [number, number];
export type ProjectionDataMap = Record<string, ProjectionPoint[]>;
export interface ProjectionResult {
  XY: ProjectionDataMap;
  XZ: ProjectionDataMap;
  YZ: ProjectionDataMap;
}
