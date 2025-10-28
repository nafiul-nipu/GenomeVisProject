// components/three-d/LightsPanel.tsx
import React from "react";
import type { LightSettings, Vec3 } from "../../types/data_types_interfaces";

type NumInputProps = React.InputHTMLAttributes<HTMLInputElement>;
const Num = (props: NumInputProps) => (
  <input
    {...props}
    type="number"
    className={`w-16 px-1 py-0.5 bg-gray-900/50 border border-gray-700 rounded text-xs ${
      props.className ?? ""
    }`}
  />
);

const Range = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    type="range"
    className={`w-28 accent-sky-400 ${props.className ?? ""}`}
  />
);

// Narrow the keys for readability and safer helpers
type AmbientKey = "ambient";
type DirKey = "dirFront" | "dirBack" | "dirLeft" | "dirRight";

export default function LightsPanel({
  settings,
  onChange,
  className = "",
  onClose,
}: {
  settings: LightSettings;
  onChange: (next: LightSettings) => void;
  className?: string;
  onClose?: () => void;
}) {
  const updateAll = (next: LightSettings) => onChange(next);

  const updateKey = <K extends keyof LightSettings>(
    key: K,
    value: LightSettings[K]
  ) => {
    updateAll({ ...settings, [key]: value });
  };

  const setAmbientField = <F extends keyof LightSettings[AmbientKey]>(
    field: F,
    v: LightSettings[AmbientKey][F]
  ) => {
    updateKey("ambient", { ...settings.ambient, [field]: v });
  };

  const setDirField = <K extends DirKey, F extends keyof LightSettings[K]>(
    key: K,
    field: F,
    v: LightSettings[K][F]
  ) => {
    updateKey(key, { ...settings[key], [field]: v });
  };

  const setDirPosition = <K extends DirKey>(
    key: K,
    idx: 0 | 1 | 2,
    v: number
  ) => {
    const nextPos: Vec3 = [
      settings[key].position[0],
      settings[key].position[1],
      settings[key].position[2],
    ];
    nextPos[idx] = v;
    updateKey(key, { ...settings[key], position: nextPos });
  };

  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-xs text-gray-200 ${className}`}
    >
      {/* Header row with optional minimize button */}
      <div className="flex items-center mb-1">
        <div className="font-semibold text-[11px]">Lights</div>
        {onClose && (
          <button
            onClick={onClose}
            title="Minimize"
            className="ml-auto px-1.5 py-0.5 rounded bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 text-gray-300"
          >
            {/* minus icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Ambient */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={settings.ambient.visible}
            onChange={(e) => setAmbientField("visible", e.target.checked)}
          />
          Ambient
        </label>
        <span className="ml-auto">Intensity</span>
        <Range
          min={0}
          max={1}
          step={0.05}
          value={settings.ambient.intensity}
          onChange={(e) => setAmbientField("intensity", Number(e.target.value))}
        />
      </div>

      {/* Directional blocks */}
      {(["dirFront", "dirBack", "dirLeft", "dirRight"] as const).map((k) => (
        <fieldset key={k} className="mb-2 border-t border-gray-800 pt-2">
          <legend className="text-[11px] px-1 text-gray-400">{k}</legend>

          <div className="flex items-center gap-2 mb-1">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings[k].visible}
                onChange={(e) => setDirField(k, "visible", e.target.checked)}
              />
              Visible
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings[k].castShadow}
                onChange={(e) => setDirField(k, "castShadow", e.target.checked)}
              />
              Shadows
            </label>

            <span className="ml-auto">Intensity</span>
            <Range
              min={0}
              max={1}
              step={0.05}
              value={settings[k].intensity}
              onChange={(e) =>
                setDirField(k, "intensity", Number(e.target.value))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Pos</span>
            <span>X</span>
            <Num
              value={settings[k].position[0]}
              step={0.1}
              onChange={(e) => setDirPosition(k, 0, Number(e.target.value))}
            />
            <span>Y</span>
            <Num
              value={settings[k].position[1]}
              step={0.1}
              onChange={(e) => setDirPosition(k, 1, Number(e.target.value))}
            />
            <span>Z</span>
            <Num
              value={settings[k].position[2]}
              step={0.1}
              onChange={(e) => setDirPosition(k, 2, Number(e.target.value))}
            />
          </div>
        </fieldset>
      ))}
    </div>
  );
}
