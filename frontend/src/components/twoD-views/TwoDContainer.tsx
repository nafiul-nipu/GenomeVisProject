// src/components/twoD-views/TwoDContainer.tsx
import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
} from "react";
import { useAppSelector } from "../../redux-store/hooks";
import { PerLabelContourMask } from "./PerLabelContourMask";
import type { DataInfoType } from "../../types/data_types_interfaces";

const PLANES: ("XY" | "YZ" | "XZ")[] = ["XY", "YZ", "XZ"];
const GAP = 6; // gap between tiles inside a group
const GROUP_GAP = 12; // gap between XY | YZ | XZ groups
const MIN_W = 50; // minimum tile width
const MIN_H = 220; // minimum tile height
const IDEAL_W = 260; // nice-looking cap for tile width

type Props = { meta_data_typed: DataInfoType };

export const TwoDContainer: React.FC<Props> = ({ meta_data_typed }) => {
  const { condTab, timeIdx, species, chromosome } = useAppSelector((s) => s.ui);
  const variant = useAppSelector((s) => s.ui.twoDVariant);
  const level = useAppSelector((s) => s.ui.twoDLevel);

  const meta = meta_data_typed[species];
  const timepoints: string[] = meta?.timepoints ?? [];
  const beforeCode = (meta?.before_name ?? "before").toLowerCase();
  const afterCode = (meta?.after_name ?? "after").toLowerCase();

  // --- build groups: [{ plane, labels: string[] }] ---
  const groups = useMemo(() => {
    if (!chromosome)
      return [] as { plane: "XY" | "YZ" | "XZ"; labels: string[] }[];

    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? timepoints[0];
      if (!tp) return [];
      // per plane: [before_t, after_t]
      return PLANES.map((plane) => ({
        plane,
        labels: [
          `${chromosome}_${tp}_${beforeCode}`,
          `${chromosome}_${tp}_${afterCode}`,
        ],
      }));
    }

    // before/after: per plane: [t1, t2, t3, ...]
    const code = condTab === "before" ? beforeCode : afterCode;
    return PLANES.map((plane) => ({
      plane,
      labels: timepoints.map((tp) => `${chromosome}_${tp}_${code}`),
    }));
  }, [chromosome, condTab, timeIdx, timepoints, beforeCode, afterCode]);

  // total columns for sizing reference
  const nCols = useMemo(
    () => groups.reduce((acc, g) => acc + g.labels.length, 0),
    [groups]
  );

  // --- measure container safely (avoid feedback loops) ---
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const next = {
        w: Math.floor(el.clientWidth),
        h: Math.floor(el.clientHeight),
      };
      setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };

    update();

    const ro = new ResizeObserver(() => {
      // batch to next frame to avoid cascading layout thrash
      requestAnimationFrame(update);
    });
    ro.observe(el);

    const onWinResize = () => requestAnimationFrame(update);
    window.addEventListener("resize", onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, []);

  // width: aim to show up to 3 tiles comfortably; cap at IDEAL_W, floor at MIN_W
  const divisor = nCols + 0.5;
  const approxW = Math.floor(size.w / divisor);
  const cellW = Math.max(MIN_W, Math.min(IDEAL_W, approxW));

  // console.log("divisor:", divisor, "approxW:", approxW, "cellW:", cellW);

  // height: fill row height, but never below MIN_H
  const rowH = Math.max(MIN_H, size.h);
  console.log("minH:", MIN_H, "size.h:", size.h, "rowH:", rowH);

  // optional: debug only when size actually changes
  useEffect(() => {
    if (size.w && size.h) {
      // console.log("[TwoDContainer] size ->", size);
    }
  }, [size.w, size.h]);

  if (!nCols) {
    return (
      <div ref={hostRef} className="w-full h-full grid place-items-center">
        <div className="text-sm text-gray-400">No 2D data available.</div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="w-full h-full overflow-x-auto overflow-y-hidden min-h-0"
    >
      {/* Single horizontal row; groups laid out left→right */}
      <div
        className="flex items-stretch min-h-0"
        style={{ gap: `${GROUP_GAP}px`, height: `${rowH}px` }}
      >
        {groups.map(({ plane, labels }) => (
          <div
            key={plane}
            className="flex items-stretch"
            style={{ gap: `${GAP}px` }}
          >
            {labels.map((label) => (
              <div
                key={`${plane}-${label}`}
                className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden flex flex-col min-h-0"
                style={{ width: `${cellW}px`, height: "100%" }}
              >
                <PerLabelContourMask
                  label={label}
                  plane={plane}
                  variant={variant}
                  level={level}
                  className="flex-1 min-h-0"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
