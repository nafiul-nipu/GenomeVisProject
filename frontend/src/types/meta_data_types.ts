export interface SpeciesInfoRaw {
  chromosomes: string[];
  timepoints: string[];
  resolution: number;
  "before-name": string;
  "after-name": string;
}

export type DataInfoType = {
  [speciesId: string]: SpeciesInfoRaw;
};
