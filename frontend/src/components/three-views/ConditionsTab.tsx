import type { ConditionTabsProps } from "../../types/data_types_interfaces";

export const ConditionTabs = ({
  setCondTab,
  condTab,
  timeIdx,
  setTimeIdx,
  meta_data_typed,
  species,
}: ConditionTabsProps) => {
  // species-specific info
  const beforeLabel =
    meta_data_typed[species]?.before_name?.toLowerCase() || "untr";
  const afterLabel =
    meta_data_typed[species]?.after_name?.toLowerCase() || "vacv";
  const diffLabel = `${beforeLabel}-${afterLabel}`;
  const timepoints = meta_data_typed[species]?.timepoints ?? [];

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: Tabs */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium">3D View</h2>

        <div className="inline-flex items-center rounded-xl border border-gray-800/70 bg-gray-900/60 overflow-hidden">
          <button
            onClick={() => setCondTab("before")}
            className={`px-3 py-1.5 text-sm border-r border-gray-800/70 ${
              condTab === "before"
                ? "bg-gray-800/50 font-semibold"
                : "text-gray-300"
            }`}
          >
            {beforeLabel}
          </button>
          <button
            onClick={() => setCondTab("after")}
            className={`px-3 py-1.5 text-sm border-r border-gray-800/70 ${
              condTab === "after"
                ? "bg-gray-800/50 font-semibold"
                : "text-gray-300"
            }`}
          >
            {afterLabel}
          </button>
          <button
            onClick={() => setCondTab("diff")}
            className={`px-3 py-1.5 text-sm ${
              condTab === "diff"
                ? "bg-gray-800/50 font-semibold"
                : "text-gray-300"
            }`}
          >
            {diffLabel}
          </button>
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
              onChange={(e) => setTimeIdx(Number(e.target.value))}
              className="w-56 accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="w-56 flex justify-between text-xs text-gray-400 select-none">
            {timepoints.map((tp, i) => (
              <span key={i}>{tp}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
