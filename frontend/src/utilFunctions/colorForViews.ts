// Pick three high-contrast colors for a dark UI
const PALETTE = ["#22d3ee", "#f59e0b", "#10b981"] as const; // cyan, amber, emerald

export const colorPaletteSelector = (idx: number): string => {
  return PALETTE[idx % PALETTE.length];
};

export const AGREEMENT_COLORS: Record<string, string> = {
  expr_acc_up: "#a02c2cf8",
  expr_acc_down: "#c1bcbbff",
  expression_only: "#1111deff",
  accessibility_only: "#c1e469ff",
  conflict: "#c7819dff",
  mixed: "#9467bd",
  stable: "#7f7f7f",
};
