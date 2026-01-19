/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../redux-store/hooks";
import { setExternalData } from "../redux-store/dataSlice";
import type {
  DataSetupWizardProps,
  DataInfoType,
  workerToClientMessageType,
} from "../types/data_types_interfaces";

import { setSpecies, setChromosome } from "../redux-store/uiSlice";

type Bundle = {
  meta: DataInfoType;
  data: workerToClientMessageType;
};

type ValidationIssue = { path: string; message: string };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function validateBundle(parsed: any): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (!isObject(parsed)) {
    return {
      ok: false,
      issues: [{ path: "", message: "File must be a JSON object." }],
    };
  }

  if (!("meta" in parsed))
    issues.push({ path: "meta", message: "Missing `meta`." });
  if (!("data" in parsed))
    issues.push({ path: "data", message: "Missing `data`." });

  const meta = parsed.meta;
  const data = parsed.data;

  if (!isObject(meta))
    issues.push({
      path: "meta",
      message: "`meta` must be an object (DataInfoType).",
    });
  if (!isObject(data))
    issues.push({
      path: "data",
      message: "`data` must be an object (workerToClientMessageType).",
    });

  // Minimal: require gene_data
  if (isObject(data) && !("gene_data" in data)) {
    issues.push({
      path: "data.gene_data",
      message: "Missing `data.gene_data` (required for 3D rendering).",
    });
  }

  // Validate gene_data shape lightly
  const gd = isObject(data) ? (data as any).gene_data : null;
  if (gd != null && !isObject(gd)) {
    issues.push({
      path: "data.gene_data",
      message: "`data.gene_data` must be a record/object of label -> array.",
    });
  } else if (isObject(gd)) {
    const keys = Object.keys(gd);
    if (keys.length === 0) {
      issues.push({
        path: "data.gene_data",
        message: "`data.gene_data` is empty. Provide at least one label.",
      });
    } else {
      const firstKey = keys[0];
      const arr = (gd as any)[firstKey];
      if (!Array.isArray(arr)) {
        issues.push({
          path: `data.gene_data.${firstKey}`,
          message: "Must be an array of gene rows.",
        });
      } else if (arr.length === 0) {
        issues.push({
          path: `data.gene_data.${firstKey}`,
          message: "Array is empty. Provide gene rows.",
        });
      } else {
        const row = arr[0];
        if (!isObject(row)) {
          issues.push({
            path: `data.gene_data.${firstKey}[0]`,
            message: "Gene row must be an object.",
          });
        } else {
          // The app uses gene_name and positionPicker; your bundle for user mode should include x/y/z.
          if (!("gene_name" in row))
            issues.push({
              path: `data.gene_data.${firstKey}[0].gene_name`,
              message: "Missing `gene_name`.",
            });
          if (!("x" in row) || !("y" in row) || !("z" in row)) {
            issues.push({
              path: `data.gene_data.${firstKey}[0]`,
              message: "Missing `x`, `y`, `z` coordinates (required for 3D).",
            });
          }
        }
      }
    }
  }

  // Validate meta minimal structure (species-> {chromosomes,timepoints,before_name,after_name})
  if (isObject(meta)) {
    const species = Object.keys(meta);
    if (species.length === 0)
      issues.push({ path: "meta", message: "`meta` has no species keys." });
    else {
      const sp = species[0];
      const spObj = (meta as any)[sp];
      if (!isObject(spObj)) {
        issues.push({
          path: `meta.${sp}`,
          message: "Species entry must be an object.",
        });
      } else {
        if (!Array.isArray(spObj.chromosomes) || spObj.chromosomes.length === 0)
          issues.push({
            path: `meta.${sp}.chromosomes`,
            message: "Provide `chromosomes` array with at least 1 value.",
          });
        if (!Array.isArray(spObj.timepoints) || spObj.timepoints.length === 0)
          issues.push({
            path: `meta.${sp}.timepoints`,
            message: "Provide `timepoints` array with at least 1 value.",
          });
        if (typeof spObj.before_name !== "string")
          issues.push({
            path: `meta.${sp}.before_name`,
            message: "Provide `before_name` string.",
          });
        if (typeof spObj.after_name !== "string")
          issues.push({
            path: `meta.${sp}.after_name`,
            message: "Provide `after_name` string.",
          });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

function makeTemplate(): Bundle {
  return {
    meta: {
      human: {
        chromosomes: ["chr1"],
        timepoints: ["t1"],
        before_name: "before",
        after_name: "after",
      },
    } as any,

    data: {
      // optional but useful for dropdowns / safety
      gene_list: ["GENE_A", "GENE_B", "GENE_C"],

      // REQUIRED: label -> array of gene rows (must include gene_name + x/y/z)
      gene_data: {
        chr1_t1_before: [
          { gene_name: "GENE_A", x: -1.2, y: 0.4, z: 0.9 },
          { gene_name: "GENE_B", x: 0.8, y: -0.6, z: -0.3 },
          { gene_name: "GENE_C", x: 0.2, y: 1.1, z: -0.7 },
        ],
        chr1_t1_after: [
          { gene_name: "GENE_A", x: -0.9, y: 0.6, z: 1.2 },
          { gene_name: "GENE_B", x: 1.0, y: -0.2, z: -0.1 },
          { gene_name: "GENE_C", x: 0.4, y: 1.3, z: -0.4 },
        ],
      },

      // OPTIONAL: tubes (leave empty if not used)
      gene_edges: {},
      gene_paths: {},

      // OPTIONAL: shape views (empty is fine for template)
      contour_data: {},
      background_mask: {},

      // OPTIONAL: temporal (empty is fine for template)
      temporalTrendData: { byGeneName: {} },

      // OPTIONAL: membership (empty is fine)
      membership: {},
    } as any,
  };
}

export function DataSetupWizard({
  onCancel,
  onComplete,
}: DataSetupWizardProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>("");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const preview = useMemo(() => {
    if (!bundle) return null;
    const species = Object.keys(bundle.meta ?? {});
    const sp = species[0] ?? "(none)";
    const metaSp: any = (bundle.meta as any)?.[sp];
    const chromosomes = metaSp?.chromosomes ?? [];
    const timepoints = metaSp?.timepoints ?? [];
    const labels = bundle.data?.gene_data
      ? Object.keys(bundle.data.gene_data as any)
      : [];
    return {
      speciesCount: species.length,
      firstSpecies: sp,
      chromosomesCount: chromosomes.length,
      timepointsCount: timepoints.length,
      labelsCount: labels.length,
      labelsPreview: labels.slice(0, 4),
    };
  }, [bundle]);

  const downloadTemplate = () => {
    const t = makeTemplate();
    const blob = new Blob([JSON.stringify(t, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "genomevis_bundle_demo.json";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const v = validateBundle(parsed);
      setIssues(v.issues);

      if (!v.ok) {
        setBundle(null);
        setStep(3);
        return;
      }

      setBundle(parsed as Bundle);
      setStep(3);
    } catch (e) {
      setBundle(null);
      setIssues([
        {
          path: "",
          message: "Failed to parse JSON. Make sure the file is valid JSON.",
        },
      ]);
      setStep(3);
    }
  };

  const loadDataset = () => {
    if (!bundle) return;

    // pick defaults from uploaded meta
    const speciesKeys = Object.keys(bundle.meta || {});
    const sp0 = speciesKeys[0];
    const chr0 = (bundle.meta as any)?.[sp0]?.chromosomes?.[0];

    if (!sp0 || !chr0) {
      alert(
        "Invalid meta: must include at least one species and one chromosome.",
      );
      return;
    }

    // update UI selection to match uploaded meta
    dispatch(setSpecies(sp0));
    dispatch(setChromosome(chr0));

    // store uploaded dataset
    dispatch(setExternalData(bundle.data));

    // switch to visualization mode
    onComplete(bundle.meta);
  };

  return (
    <div className="w-full h-screen grid place-items-center bg-black text-white">
      <div className="w-full max-w-2xl px-6">
        {/* Header */}
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-2xl font-semibold">Load your data</h2>
          <p className="text-gray-400 text-sm">
            GenomeVis visualizes{" "}
            <span className="text-gray-200">precomputed</span> outputs (it does
            not run MPASE). Upload a single JSON bundle that contains metadata +
            precomputed results.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-gray-300">
          <div
            className={`px-2 py-1 rounded ${step === 1 ? "bg-sky-600/40" : "bg-gray-800/60"}`}
          >
            1. Requirements
          </div>
          <div className="text-gray-600">→</div>
          <div
            className={`px-2 py-1 rounded ${step === 2 ? "bg-sky-600/40" : "bg-gray-800/60"}`}
          >
            2. Upload
          </div>
          <div className="text-gray-600">→</div>
          <div
            className={`px-2 py-1 rounded ${step === 3 ? "bg-sky-600/40" : "bg-gray-800/60"}`}
          >
            3. Validate & Load
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
            <div className="text-left space-y-2">
              <div className="text-sm text-gray-200 font-medium">
                What you need to provide
              </div>
              <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
                <li>
                  <span className="text-gray-200">meta</span>: species →
                  chromosomes, timepoints, before_name, after_name
                </li>
                <li>
                  Recommended:{" "}
                  <span className="text-gray-200">data.gene_list</span> (array
                  of gene names for the Gene dropdown)
                </li>

                <li>
                  Optional: <span className="text-gray-200">contour_data</span>,{" "}
                  <span className="text-gray-200">background_mask</span>,{" "}
                  <span className="text-gray-200">gene_edges</span>,{" "}
                  <span className="text-gray-200">gene_paths</span>,{" "}
                  <span className="text-gray-200">temporalTrendData</span>
                </li>
              </ul>

              <div className="text-sm text-gray-200 font-medium mt-3">
                Label naming convention (recommended)
              </div>
              <div className="text-sm text-gray-400">
                <code className="text-gray-200">
                  {"<chromosome>_<timepoint>_<condition>"}
                </code>
                <span className="text-gray-500"> (example: </span>
                <code className="text-gray-200">chr1_t1_before</code>
                <span className="text-gray-500">)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition text-sm"
              >
                Download JSON template
              </button>

              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 transition text-sm font-medium"
              >
                Continue
              </button>
            </div>

            <button
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60
                         hover:bg-gray-800/60 hover:border-gray-500 transition px-5 py-6 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                  <span className="text-sky-300 text-lg">⬆</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    Click to choose a JSON bundle
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Expected:{" "}
                    <span className="text-gray-300">genomevis_bundle.json</span>
                  </div>
                </div>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition text-sm"
              >
                Back
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
            <div className="text-sm text-gray-300">
              File:{" "}
              <span className="text-gray-100">{fileName || "(none)"}</span>
            </div>

            {issues.length > 0 && (
              <div className="rounded-lg border border-red-800/60 bg-red-900/20 p-4">
                <div className="text-sm font-medium text-red-200 mb-2">
                  Validation errors
                </div>
                <ul className="text-sm text-red-100 list-disc pl-5 space-y-1">
                  {issues.map((it, i) => (
                    <li key={i}>
                      <span className="text-red-200">
                        {it.path || "(file)"}
                      </span>
                      : {it.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {issues.length === 0 && bundle && preview && (
              <div className="rounded-lg border border-emerald-800/60 bg-emerald-900/20 p-4">
                <div className="text-sm font-medium text-emerald-200 mb-2">
                  Looks good
                </div>
                <div className="text-sm text-emerald-100 space-y-1">
                  <div>
                    Species: {preview.firstSpecies} (total:{" "}
                    {preview.speciesCount})
                  </div>
                  <div>Chromosomes: {preview.chromosomesCount}</div>
                  <div>Timepoints: {preview.timepointsCount}</div>
                  <div>Labels found: {preview.labelsCount}</div>
                  <div className="text-xs text-emerald-200">
                    Example labels: {preview.labelsPreview.join(", ")}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition text-sm"
              >
                Choose another file
              </button>

              <button
                disabled={!bundle || issues.length > 0}
                onClick={loadDataset}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !bundle || issues.length > 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                Load dataset
              </button>
            </div>

            <button
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
