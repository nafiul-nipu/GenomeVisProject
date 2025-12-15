import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import {
  setTemporalClassFilter,
  clearTemporalClassFilter,
} from "../../redux-store/uiSlice";
import type { AgreementClass } from "../../types/data_types_interfaces";

const ALL: AgreementClass[] = [
  "conflict",
  "mixed",
  "expr_acc_up",
  "expr_acc_down",
  "expression_only",
  "accessibility_only",
  "stable",
];

export function TemporalFilterControls() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.ui.temporalClassFilter);

  const toggle = (cls: AgreementClass) => {
    const next = new Set(selected);

    if (next.has(cls)) {
      next.delete(cls);
    } else {
      next.add(cls);
    }

    dispatch(setTemporalClassFilter(Array.from(next)));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-300">Temporal:</span>
      {ALL.map((cls) => (
        <button
          key={cls}
          onClick={() => toggle(cls)}
          className={`text-xs px-2 py-1 rounded-md border transition ${
            selected.includes(cls)
              ? "border-sky-400/80 bg-sky-500/15 text-sky-100"
              : "border-gray-700 text-gray-200 hover:bg-gray-800/40"
          }`}
          title={`Highlight ${cls}`}
        >
          {cls}
        </button>
      ))}
      <button
        onClick={() => dispatch(clearTemporalClassFilter())}
        className="text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800/40"
      >
        Clear
      </button>
    </div>
  );
}
