export interface ChromosomeDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
}

import type { DataInfoType } from "../types/meta_data_types";
export interface SpeciesDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
  setChromosome: (chr: string) => void;
  meta_data: DataInfoType;
}
