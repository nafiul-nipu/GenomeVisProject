// components/ConditionTabs.tsx
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCondTabstate, setTimeIdx } from "../../store/uiSlice";
import type { ConditionTabsProps } from "../../types/data_types_interfaces";

export const ConditionTabs = ({ meta_data_typed }: ConditionTabsProps) => {
  const dispatch = useAppDispatch();
  const { condTab, timeIdx, species } = useAppSelector((s) => s.ui);

  // species-specific info
  const beforeLabel =
    meta_data_typed[species]?.before_name?.toLowerCase() || "untr";
  const afterLabel =
    meta_data_typed[species]?.after_name?.toLowerCase() || "vacv";
  const diffLabel = `${beforeLabel}-${afterLabel}`;
  const timepoints = meta_data_typed[species]?.timepoints ?? [];

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: Tabs (fixed width to prevent layout shift) */}
      <div className="flex items-center gap-3 w-[18rem]">
        <h2 className="text-lg font-medium">3D View</h2>

        <div className="inline-flex items-center rounded-xl border border-gray-800/70 bg-gray-900/60 overflow-hidden divide-x divide-gray-800/70 whitespace-nowrap">
          {[
            { key: "before", label: beforeLabel },
            { key: "after", label: afterLabel },
            { key: "diff", label: diffLabel },
          ].map(({ key, label }) => {
            const active = condTab === (key as "before" | "after" | "diff");
            return (
              <button
                key={key}
                onClick={() =>
                  dispatch(setCondTabstate(key as "before" | "after" | "diff"))
                }
                className={`w-28 px-3 py-1.5 text-sm font-semibold ${
                  active ? "bg-gray-800/50" : "text-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Slider for diff */}
      {condTab === "diff" && timepoints.length > 0 && (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300">Time</label>
            <input
              type="range"
              min={0}
              max={timepoints.length - 1}
              step={1}
              value={timeIdx}
              onChange={(e) => dispatch(setTimeIdx(Number(e.target.value)))}
              className="w-56 accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="w-56 flex justify-between text-[11px] text-gray-400 select-none whitespace-nowrap">
            {timepoints.map((tp, i) => (
              <span key={i} className="tabular-nums">
                {tp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
