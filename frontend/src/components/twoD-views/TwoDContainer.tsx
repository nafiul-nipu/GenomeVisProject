// src/components/twoD/TwoDContainer.tsx
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { useAppSelector } from "../../redux-store/hooks";
import { PerLabelContourMask } from "./PerLabelContourMask";
import type { DataInfoType } from "../../types/data_types_interfaces";

const PLANES: ("XY" | "YZ" | "XZ")[] = ["XY", "YZ", "XZ"];
const GAP = 2; // px gap between cells
const MIN_W = 160; // min tile width
const MIN_H = 250; // min tile height

type Props = { meta_data_typed: DataInfoType };

export const TwoDContainer: React.FC<Props> = ({ meta_data_typed }) => {
  const { condTab, timeIdx, species, chromosome } = useAppSelector((s) => s.ui);
  const variant = useAppSelector((s) => s.ui.twoDVariant);
  const level = useAppSelector((s) => s.ui.twoDLevel);

  const meta = meta_data_typed[species];
  const timepoints: string[] = meta?.timepoints ?? [];
  const beforeCode = (meta?.before_name ?? "before").toLowerCase();
  const afterCode = (meta?.after_name ?? "after").toLowerCase();

  // columns correspond to timepoints/labels (same order as 3D row)
  const colLabels = useMemo(() => {
    if (!chromosome || !timepoints.length) return [] as string[];
    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? timepoints[0] ?? "";
      return [
        `${chromosome}_${tp}_${beforeCode}`,
        `${chromosome}_${tp}_${afterCode}`,
      ];
    }
    const code = condTab === "before" ? beforeCode : afterCode;
    return timepoints.map((tp) => `${chromosome}_${tp}_${code}`); // e.g. 3 labels
  }, [chromosome, condTab, timeIdx, timepoints, beforeCode, afterCode]);

  // single-row ordering: XY,YZ,XZ for tp1, then XY,YZ,XZ for tp2, ...
  const cells = useMemo(
    () =>
      colLabels.flatMap((label) => PLANES.map((plane) => ({ label, plane }))),
    [colLabels]
  );

  // measure available space
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!hostRef.current) return;
    const el = hostRef.current;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const cols = Math.max(1, cells.length); // all tiles in ONE ROW
  const cellW = Math.max(MIN_W, Math.floor((size.w - GAP * (cols - 1)) / cols));
  const cellH = Math.max(MIN_H, size.h); // single row fills the available height

  if (!cells.length) {
    return (
      <div ref={hostRef} className="w-full h-full grid place-items-center">
        <div className="text-sm text-gray-400">No 2D data available.</div>
      </div>
    );
  }

  return (
    <div ref={hostRef} className="w-full h-full overflow-hidden">
      {/* ONE ROW grid: all nine in a single line */}
      <div
        style={{
          display: "grid",
          gap: `${GAP}px`,
          gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
          gridTemplateRows: `${cellH}px`, // single row
        }}
      >
        {cells.map(({ label, plane }) => (
          <div
            key={`${label}-${plane}`}
            className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden"
            style={{ width: cellW, height: cellH }}
          >
            <PerLabelContourMask
              label={label}
              plane={plane}
              variant={variant}
              level={level}
              // keep titles ON, per your example text
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
