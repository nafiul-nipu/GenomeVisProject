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
  meta_data: DataInfoType;
}

export interface SpeciesDropdownProps {
  meta_data: DataInfoType;
}

export interface GeneDropdownProps {
  placeholder?: string;
  className?: string;
}

export interface ConditionTabsProps {
  meta_data_typed: DataInfoType;
}

export interface workerPostMessageType {
  data_info: DataInfoType;
  species: string;
  chromosome: string;
  requestId?: string;
  op?: string;
}

export interface Gene_Edges_Path_Row_Type {
  source: number;
  target: number;
}
export interface workerToClientMessageType {
  gene_data: Record<string, GeneRowDataType[]>;
  gene_list: string[];
  gene_edges: Record<string, Gene_Edges_Path_Row_Type[]>;
  gene_paths: Record<string, number[][]>;
  contour_data: Record<string, ContourWrapperType>;
  projectionData: ProjectionResult;
  perLabelBackgroundMaskData: PerLabelBackgroundMask;
  membership: MembershipState;
  temporalTrendData: TemporalTrendData;
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

export interface NodeControl {
  geneColor: string;
  geneEmissive: string;
  geneSpecular: string;
  geneShininess: number;
  geneRadius: number;
}

export interface TubeControl {
  tubeColor: string;
  tubeEmissive: string;
  tubeSpecular: string;
  tubeShininess: number;
  tubeRadius: number;
}

export interface GeneSphereViewProps {
  label: string;
  viewRef: React.RefObject<HTMLDivElement>;
  geneColorPickerIdx?: number;
  data: GeneRowDataType[];
  positionMode: PositionMode;
  nodeCtl: NodeControl;
  highlightedIdxs?: number[];
  hoveredIdx?: number | null;
}

export interface GeneTubeViewProps {
  geneData: GeneRowDataType[];
  geneEdges: Gene_Edges_Path_Row_Type[];
  genePaths: number[][];
  positionMode: PositionMode;
  tubeCtl: TubeControl;
}

export interface DrawObjectProps {
  label: string;
  viewRef: React.RefObject<HTMLDivElement>;
  geneColorPickerIdx?: number;
  geneData: GeneRowDataType[];
  geneEdges: Gene_Edges_Path_Row_Type[];
  genePaths: number[][];
  positionMode: PositionMode;
  nodeCtl: NodeControl;
  tubeCtl: TubeControl;
}
export type PositionMode = "aligned" | "middle" | "start" | "end";
export interface PositionPicker {
  (item: GeneRowDataType, mode: PositionMode): [number, number, number];
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

export type MaskMatrix = number[][];

export interface BackgroundMask {
  XY: MaskMatrix;
  XZ: MaskMatrix;
  YZ: MaskMatrix;
}
export type PerLabelBackgroundMask = Record<string, BackgroundMask>;

export interface PerLabelContourMaskProps {
  idx?: number;
  label: string; // e.g., "12h_UNTR"
  plane: Plane; // "XY" | "YZ" | "XZ"
  variant: Variant; // "hdr" | "pf"
  level: number; // 50..100
  maskOpacity?: number; // default 0.18
  className?: string;
}

export type Vec3 = [number, number, number];
export interface LightSettings {
  ambient: { visible: boolean; intensity: number };
  dirFront: {
    visible: boolean;
    position: Vec3;
    intensity: number;
    castShadow: boolean;
  };
  dirBack: {
    visible: boolean;
    position: Vec3;
    intensity: number;
    castShadow: boolean;
  };
  dirLeft: {
    visible: boolean;
    position: Vec3;
    intensity: number;
    castShadow: boolean;
  };
  dirRight: {
    visible: boolean;
    position: Vec3;
    intensity: number;
    castShadow: boolean;
  };
}

export const defaultLightSettings: LightSettings = {
  ambient: { visible: true, intensity: 0.5 },
  dirFront: {
    visible: true,
    position: [3.3, 1.0, 4.4],
    intensity: 0.4,
    castShadow: true,
  },
  dirBack: {
    visible: true,
    position: [-3.3, -1.0, -4.4],
    intensity: 0.4,
    castShadow: true,
  },
  dirLeft: {
    visible: true,
    position: [-5.0, 5.0, 5.0],
    intensity: 0.4,
    castShadow: true,
  },
  dirRight: {
    visible: true,
    position: [5.0, 5.0, 5.0],
    intensity: 0.4,
    castShadow: true,
  },
};

export type Edge = { source: number; target: number };

export type Variant = "hdr" | "pf";
export type Plane = "XY" | "YZ" | "XZ";

export type MembershipVariant = "hdr" | "point_fraction";

export type MembershipPlaneEntry = {
  pixels: [number, number][]; // length N, a point per gene
  hdr: Record<string, number[]>;
  point_fraction: Record<string, number[]>;
};

export type MembershipLabelEntry = {
  points: number;
  ids: string[];
  planes: {
    [plane in Plane]?: MembershipPlaneEntry;
  };
};

export type MembershipState = {
  [label: string]: MembershipLabelEntry;
};

export interface FetchMembershipArgs {
  speciesName: string;
  chrName: string;
  dataInfo?: DataInfoType;
}

export type CondTab = "before" | "after" | "diff";

export interface CameraState {
  position: Vec3;
  target: Vec3;
}

export interface UIState {
  species: string;
  chromosome: string;
  selectedGenes: string[];
  condTab: CondTab;
  timeIdx: number;
  toggleLightGear: boolean;
  lightSettings: LightSettings;
  twoDVariant: Variant; // "hdr" | "pf"
  twoDLevel: number; // 100, 99, ...
  twoDCleanBlobs: boolean;
  twoDBlobMinAreaPct: number; // e.g., 5 = keep blobs >= 5% of largest area
  highlightedGenesByLabel: Record<string, number[]>; // 2D to 3D
  hoveredGene: { label: string; idx: number } | null; // 3D to 2D
  camera: CameraState;
  geneColorMode: GeneColorMode;
  temporalClassFilter: AgreementClass[]; // empty = no filter
}

export interface DataState {
  data: workerToClientMessageType | null;
  status: "idle" | "loading" | "success" | "failed";
  error?: string;
}

// Temporal Trend Types
export type AgreementClass =
  | "mixed"
  | "conflict"
  | "expr_acc_up"
  | "expr_acc_down"
  | "accessibility_only"
  | "expression_only"
  | "stable";

export interface TemporalTrendRowRaw {
  gene_id: string;
  gene_name: string;
  agreement_class: AgreementClass;

  increase?: number;
  decrease?: number;
  neutral?: number;

  // Raw JSON has many extra columns. Keep it typed-safe without `any`.
  [key: string]: unknown;
}

export interface TemporalTrendRow {
  gene_id: string;
  gene_name: string;
  agreement_class: AgreementClass;

  // derived from meta_data timepoints
  expr_delta_by_time: Record<string, number | null>;
  acc_delta_by_time: Record<string, number | null>;

  increase: number | null;
  decrease: number | null;
  neutral: number | null;
}

export interface TemporalTrendData {
  chr: string;
  timepoints: string[];
  rows: TemporalTrendRow[];
  byGeneName: Record<string, TemporalTrendRow>;
}

export type GeneColorMode = "viewPalette" | "temporalAgreement";
