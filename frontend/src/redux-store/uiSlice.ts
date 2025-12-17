import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  defaultLightSettings,
  type AgreementClass,
  type CameraState,
  type CondTab,
  type LightSettings,
  type UIState,
  type Variant,
} from "../types/data_types_interfaces";

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
  camera: {
    position: [10, 5, 75],
    target: [0, 0, 0],
  },
  temporalClassFilter: [],
  // 2D panel tabs
  twoDPanelTab: "shape",
  temporal2DMaxGenes: 250,
  temporal2DBarcodeSort: "abs",
  temporal2DDeltaMode: "mean",
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
    // CAMERA SYNC
    setCameraState(state, action: PayloadAction<CameraState>) {
      state.camera = action.payload;
    },

    // SNAPSHOT LOAD
    loadSnapshot(state, action: PayloadAction<Partial<UIState>>) {
      // shallow merge: any missing fields keep current values
      return { ...state, ...action.payload };
    },

    // RESET TO DEFAULT
    resetUI() {
      return initialState;
    },
    setTemporalClassFilter(state, action: PayloadAction<AgreementClass[]>) {
      state.temporalClassFilter = action.payload;
    },
    clearTemporalClassFilter(state) {
      state.temporalClassFilter = [];
    },
    // twoD panel and temporal scatter etc
    setTwoDPanelTab(state, action: PayloadAction<"shape" | "temporal">) {
      state.twoDPanelTab = action.payload;
    },
    setTemporal2DMaxGenes(state, action: PayloadAction<number>) {
      state.temporal2DMaxGenes = action.payload;
    },
    setTemporal2DBarcodeSort(
      state,
      action: PayloadAction<"abs" | "expr" | "acc">
    ) {
      state.temporal2DBarcodeSort = action.payload;
    },
    setTemporal2DDeltaMode(
      state,
      action: PayloadAction<"mean" | "last" | "peakAbs">
    ) {
      state.temporal2DDeltaMode = action.payload;
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
  setCameraState,
  loadSnapshot,
  resetUI,
  setTemporalClassFilter,
  clearTemporalClassFilter,
  setTwoDPanelTab,
  setTemporal2DMaxGenes,
  setTemporal2DBarcodeSort,
  setTemporal2DDeltaMode,
} = uiSlice.actions;

export default uiSlice.reducer;
export type { CondTab, UIState };
