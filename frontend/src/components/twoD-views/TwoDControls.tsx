import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import { setTwoDVariant, setTwoDLevel } from "../../redux-store/uiSlice";
import type { Variant, Contour2DType } from "../../types/data_types_interfaces";

export const TwoDControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const { twoDVariant, twoDLevel } = useAppSelector((s) => s.ui);
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
    </div>
  );
};
