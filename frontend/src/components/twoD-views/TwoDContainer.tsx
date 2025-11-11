// src/components/twoD/TwoDContainer.tsx
import React from "react";
import { useAppSelector } from "../../redux-store/hooks";
import { PerLabelContourMask } from "./PerLabelContourMaks";

export const TwoDContainer: React.FC = () => {
  // from redux
  const variant = useAppSelector((s) => s.ui.twoDVariant); // "hdr" | "pf"
  const level = useAppSelector((s) => s.ui.twoDLevel); // number
  // const condTab = useAppSelector((s) => s.ui.condTab); // "untr" | "vacv" | "diff"
  // const activeLabel = useAppSelector((s) => s.ui.); // e.g. "chr1_12hrs_untr"
  const activeLabel = "chr1_12hrs_untr"; // temporary

  // safety
  if (!activeLabel) {
    return (
      <div className="text-sm text-gray-400">No active label selected.</div>
    );
  }

  const PLANES: ("XY" | "YZ" | "XZ")[] = ["XY", "YZ", "XZ"];

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {PLANES.map((plane) => (
        <PerLabelContourMask
          key={`${activeLabel}-${plane}`}
          label={activeLabel}
          plane={plane}
          variant={variant}
          level={level}
          className="w-full"
        />
      ))}
    </div>
  );
};
