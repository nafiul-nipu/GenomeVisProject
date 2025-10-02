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
