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
}: {
  settings: LightSettings;
  onChange: (next: LightSettings) => void;
  className?: string;
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
    // clone the Vec3 safely
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
      <div className="font-semibold text-[11px] mb-1">Lights</div>

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
