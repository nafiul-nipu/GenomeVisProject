// Pick three high-contrast colors for a dark UI
const PALETTE = ["#22d3ee", "#f59e0b", "#10b981"] as const; // cyan, amber, emerald

export const colorPaletteSelector = (idx: number) => {
  return PALETTE[idx % PALETTE.length];
};
