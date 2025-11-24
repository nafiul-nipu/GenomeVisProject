import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  defaultLightSettings,
  type LightSettings,
  type Variant,
} from "../types/data_types_interfaces";

type CondTab = "before" | "after" | "diff";

interface UIState {
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
}

const initialState: UIState = {
  species: "green_monkey",
  chromosome: "chr1",
  selectedGenes: [],
  condTab: "before",
  timeIdx: 0,
  toggleLightGear: false,
  lightSettings: defaultLightSettings,
  twoDVariant: "hdr",
  twoDLevel: 100,
  twoDCleanBlobs: false,
  twoDBlobMinAreaPct: 2,
  highlightedGenesByLabel: {},
  hoveredGene: null,
};

// creating slices
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSpecies(state, action: PayloadAction<string>) {
      state.species = action.payload;
    },
    setChromosome(state, action: PayloadAction<string>) {
      state.chromosome = action.payload;
    },
    setSelectedGenes(state, action: PayloadAction<string[]>) {
      state.selectedGenes = action.payload;
    },
    setCondTabstate(state, action: PayloadAction<CondTab>) {
      state.condTab = action.payload;
    },
    setTimeIdx(state, action: PayloadAction<number>) {
      state.timeIdx = action.payload;
    },
    setLightSettingsOpen(state, action: PayloadAction<boolean>) {
      state.toggleLightGear = action.payload;
    },
    setLightSettings(state, action: PayloadAction<LightSettings>) {
      state.lightSettings = action.payload;
    },
    setTwoDVariant(state, action: PayloadAction<Variant>) {
      state.twoDVariant = action.payload;
    },
    setTwoDLevel(state, action: PayloadAction<number>) {
      state.twoDLevel = action.payload;
    },
    setTwoDCleanBlobs(state, action: PayloadAction<boolean>) {
      state.twoDCleanBlobs = action.payload;
    },
    setTwoDBlobMinAreaPct(state, action: PayloadAction<number>) {
      state.twoDBlobMinAreaPct = action.payload;
    },
    setHighlightedGenesForLabel(
      state,
      action: PayloadAction<{ label: string; indices: number[] }>
    ) {
      const { label, indices } = action.payload;
      state.highlightedGenesByLabel[label] = indices;
    },
    clearHighlightedGenes(state) {
      state.highlightedGenesByLabel = {};
    },
    setHoveredGene(
      state,
      action: PayloadAction<{ label: string; idx: number } | null>
    ) {
      state.hoveredGene = action.payload;
    },
  },
});

export const {
  setSpecies,
  setChromosome,
  setSelectedGenes,
  setCondTabstate,
  setTimeIdx,
  setLightSettingsOpen,
  setLightSettings,
  setTwoDVariant,
  setTwoDLevel,
  setTwoDCleanBlobs,
  setTwoDBlobMinAreaPct,
  setHighlightedGenesForLabel,
  clearHighlightedGenes,
  setHoveredGene,
} = uiSlice.actions;

export default uiSlice.reducer;
export type { CondTab, UIState };
