// Pick three high-contrast colors for a dark UI
const PALETTE = ["#22d3ee", "#f59e0b", "#10b981"] as const; // cyan, amber, emerald

export const colorPaletteSelector = (idx: number): string => {
  return PALETTE[idx % PALETTE.length];
};

export const AGREEMENT_COLORS: Record<string, string> = {
  // concordant
  expr_acc_up: "#a02c2c", // deep red
  expr_acc_down: "#c1bcbb", // muted gray

  // partial regulation
  expression_only: "#1111de", // strong blue
  accessibility_only: "#c1e469", // light green

  // disagreement / complexity
  conflict: "#c7819d", // pink/magenta (FIXED)
  mixed: "#9467bd", // purple

  // baseline
  stable: "#7f7f7f", // neutral gray
};
