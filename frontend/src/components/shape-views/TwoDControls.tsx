import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import {
  setTwoDVariant,
  setTwoDLevel,
  setTwoDCleanBlobs,
  setTwoDBlobMinAreaPct,
} from "../../redux-store/uiSlice";
import type { Variant, Contour2DType } from "../../types/data_types_interfaces";

export const TwoDControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const { twoDVariant, twoDLevel, twoDCleanBlobs, twoDBlobMinAreaPct } =
    useAppSelector((s) => s.ui);
  const contoursRec = useAppSelector((s) => s.data.data?.contour_data);

  // derive available levels from whatever contours exist
  const levelOptions = useMemo(() => {
    const all: Contour2DType[] = [];
    if (contoursRec)
      Object.values(contoursRec).forEach((w) =>
        all.push(...(w.contours ?? []))
      );
    const s = new Set<number>(
      all.length
        ? all.map((c) => c.level)
        : [100, 99, 98, 97, 96, 95, 90, 80, 60, 50]
    );
    return Array.from(s).sort((a, b) => b - a);
  }, [contoursRec]);

  // keep level valid if data changes
  useEffect(() => {
    if (!levelOptions.length) return;
    if (!levelOptions.includes(twoDLevel)) {
      dispatch(setTwoDLevel(levelOptions[0]));
    }
  }, [levelOptions]); // eslint-disable-line

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Variant selector */}
      <label className="flex items-center gap-2">
        <span className="text-gray-300">Variant</span>
        <select
          className="bg-gray-800/70 border border-gray-700 rounded px-2 py-1"
          value={twoDVariant}
          onChange={(e) => dispatch(setTwoDVariant(e.target.value as Variant))}
        >
          <option value="hdr">HDR</option>
          <option value="pf">Point-Fraction</option>
        </select>
      </label>

      {/* Level selector */}
      <label className="flex items-center gap-2">
        <span className="text-gray-300">Level</span>
        <select
          className="bg-gray-800/70 border border-gray-700 rounded px-2 py-1"
          value={twoDLevel}
          onChange={(e) => dispatch(setTwoDLevel(+e.target.value))}
        >
          {levelOptions.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
      </label>

      {/* Clean blobs toggle */}
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          className="h-3 w-3 accent-sky-500"
          checked={twoDCleanBlobs}
          onChange={(e) => dispatch(setTwoDCleanBlobs(e.target.checked))}
        />
        <span className="text-gray-300">Clean blobs</span>
      </label>

      {/* Min area % (only relevant when clean is on, but always editable) */}
      <label className="flex items-center gap-1 relative group">
        <span className="text-gray-300">Min shape area (%)</span>

        <span
          className="text-gray-400 cursor-default border border-gray-600 rounded-full
               w-4 h-4 flex items-center justify-center text-[10px]
               group-hover:bg-gray-700 group-hover:text-white transition"
        >
          ?
        </span>

        <input
          type="number"
          min={0}
          max={50}
          step={1}
          className="w-14 bg-gray-800/70 border border-gray-700 rounded px-1 py-0.5 text-right"
          value={twoDBlobMinAreaPct}
          onChange={(e) =>
            dispatch(
              setTwoDBlobMinAreaPct(
                Math.max(0, Math.min(50, +e.target.value || 0))
              )
            )
          }
        />

        {/* Tooltip BELOW */}
        <div
          className="
      absolute top-full mt-1 left-0
      max-w-[220px]
      px-2 py-1 rounded bg-black text-xs text-white shadow-lg
      whitespace-normal
      opacity-0 pointer-events-none
      group-hover:opacity-100 group-hover:pointer-events-auto
      transition-opacity duration-150
      z-50
    "
        >
          Hides shapes smaller than this percentage of the largest shape.
        </div>
      </label>
    </div>
  );
};
