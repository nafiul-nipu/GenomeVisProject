// Pick three high-contrast colors for a dark UI
const PALETTE = ["#22d3ee", "#f59e0b", "#10b981"] as const; // cyan, amber, emerald

export const colorPaletteSelector = (idx: number): string => {
  return PALETTE[idx % PALETTE.length];
};

export const AGREEMENT_COLORS: Record<string, string> = {
  expr_acc_up: "#2ca02c",
  expr_acc_down: "#d62728",
  expression_only: "#1f77b4",
  accessibility_only: "#17becf",
  conflict: "#ff7f0e",
  mixed: "#9467bd",
  stable: "#7f7f7f",
};
