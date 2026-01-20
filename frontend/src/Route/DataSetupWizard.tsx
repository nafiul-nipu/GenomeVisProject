/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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

type UploadMode = "bundle" | "folder";

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

  const meta = (parsed as any).meta;
  const data = (parsed as any).data;

  const pickModeFromMeta = (metaAny: any) => {
    if (!isObject(metaAny)) return "default";
    const sp = Object.keys(metaAny)[0];
    const cfg: any = sp ? (metaAny as any)[sp] : null;
    const m = cfg?.gene_position_to_use;
    return m === "aligned" || m === "middle" || m === "start" || m === "end"
      ? m
      : "default";
  };

  const hasCoordsForMode = (row: any, mode: string) => {
    const hasMiddle =
      ("middle_x" in row && "middle_y" in row && "middle_z" in row) ||
      (Array.isArray(row?.middle) && row.middle.length === 3);

    if (mode === "aligned") {
      return (
        (Array.isArray(row?.aligned_pos) && row.aligned_pos.length === 3) ||
        hasMiddle
      );
    }
    if (mode === "start") {
      return (
        ("start_x" in row && "start_y" in row && "start_z" in row) || hasMiddle
      );
    }
    if (mode === "end") {
      return ("end_x" in row && "end_y" in row && "end_z" in row) || hasMiddle;
    }
    if (mode === "middle") {
      return hasMiddle;
    }
    // default: accept x/y/z OR middle
    const hasXYZ = "x" in row && "y" in row && "z" in row;
    return hasXYZ || hasMiddle;
  };

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
          if (!("gene_name" in row))
            issues.push({
              path: `data.gene_data.${firstKey}[0].gene_name`,
              message: "Missing `gene_name`.",
            });

          const mode = pickModeFromMeta(meta);
          if (!hasCoordsForMode(row, mode)) {
            issues.push({
              path: `data.gene_data.${firstKey}[0]`,
              message: `Missing coordinates for mode "${mode}". Provide aligned_pos OR middle_x/y/z OR start_x/y/z OR end_x/y/z (depending on meta.gene_position_to_use).`,
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
        gene_position_to_use: "aligned",
      },
    } as any,

    data: {
      gene_list: ["GENE_A", "GENE_B", "GENE_C"],

      gene_data: {
        chr1_t1_before: [
          { gene_name: "GENE_A", aligned_pos: [-1.2, 0.4, 0.9] },
          { gene_name: "GENE_B", aligned_pos: [0.8, -0.6, -0.3] },
          { gene_name: "GENE_C", aligned_pos: [0.2, 1.1, -0.7] },
        ],
        chr1_t1_after: [
          { gene_name: "GENE_A", aligned_pos: [-0.9, 0.6, 1.2] },
          { gene_name: "GENE_B", aligned_pos: [1, -0.2, -0.1] },
          { gene_name: "GENE_C", aligned_pos: [0.4, 1.3, -0.4] },
        ],
      },

      gene_edges: {},
      gene_paths: {},

      contour_data: {},
      perLabelBackgroundMaskData: {},
      projectionData: { XY: {}, XZ: {}, YZ: {} },

      temporalTrendData: { byGeneName: {} },

      membership: {},
    } as any,
  };
}

function stripKnownPrefix(p: string) {
  return p
    .replace(/^.*?dataroot\//, "")
    .replace(/^.*?public\/dataroot\//, "")
    .replace(/^\//, "");
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

type FolderProgressFn = (done: number, total: number, label: string) => void;

async function buildBundleFromFolder(
  files: FileList,
  onProgress?: FolderProgressFn,
): Promise<{
  bundle: Bundle | null;
  issues: ValidationIssue[];
  fileCount: number;
  metaFile?: string;
}> {
  const issues: ValidationIssue[] = [];
  const all = Array.from(files);

  const jsonFiles = all.filter((f) => f.name.toLowerCase().endsWith(".json"));
  if (!jsonFiles.length) {
    return {
      bundle: null,
      issues: [{ path: "", message: "No .json files found in folder." }],
      fileCount: all.length,
    };
  }

  // Map: normalized relative path -> parsed JSON
  const contentByPath = new Map<string, unknown>();

  const total = jsonFiles.length;
  let done = 0;

  for (const f of jsonFiles) {
    const rel = stripKnownPrefix((f as any).webkitRelativePath || f.name);

    onProgress?.(done, total, `Reading ${rel}`);

    const text = await f.text();
    const parsed = safeJsonParse(text);
    if (parsed == null) {
      issues.push({ path: rel, message: "Invalid JSON (failed to parse)." });
    } else {
      contentByPath.set(rel, parsed);
    }

    done++;
    onProgress?.(done, total, `Parsed ${rel}`);

    // yield so UI can repaint
    if (done % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  // Find meta (data_info.json preferred)
  const metaCandidates = [
    "data_info.json",
    "meta.json",
    "dataroot/data_info.json",
  ];
  let metaPath: string | undefined;
  for (const p of metaCandidates) {
    const found = Array.from(contentByPath.keys()).find((k) =>
      k.toLowerCase().endsWith(p),
    );
    if (found) {
      metaPath = found;
      break;
    }
  }

  if (!metaPath) {
    issues.push({
      path: "(folder)",
      message:
        "Missing data_info.json (required). Put it inside the selected folder (or inside dataroot/).",
    });
    return { bundle: null, issues, fileCount: all.length };
  }

  const meta = contentByPath.get(metaPath) as unknown;
  if (!isObject(meta)) {
    issues.push({
      path: metaPath,
      message: "data_info.json must be a JSON object (DataInfoType).",
    });
    return { bundle: null, issues, fileCount: all.length, metaFile: metaPath };
  }

  const metaTyped = meta as DataInfoType;
  const speciesKeys = Object.keys(metaTyped);
  if (!speciesKeys.length) {
    issues.push({
      path: metaPath,
      message: "data_info.json has no species keys.",
    });
    return { bundle: null, issues, fileCount: all.length, metaFile: metaPath };
  }

  // Build workerToClientMessageType from available files.
  const data: workerToClientMessageType = {
    gene_data: {},
    gene_list: [],
    gene_edges: {},
    gene_paths: {},
    contour_data: {},
    projectionData: { XY: {}, XZ: {}, YZ: {} },
    perLabelBackgroundMaskData: {},
    membership: {},
    temporalTrendData: { chr: "", timepoints: [], rows: [], byGeneName: {} },
  };

  (data as any).temporalTrendDataByChr = {};

  const inferLabelKey = (fileName: string) => {
    const base = fileName.replace(/\.json$/i, "");
    const parts = base.split("_");
    if (parts.length < 4) return null;
    return `${parts[0]}_${parts[1]}_${parts[2]}`;
  };

  onProgress?.(done, total, "Collecting gene_data…");

  // 1) gene_data files
  for (const sp of speciesKeys) {
    const cfg: any = (metaTyped as any)[sp];
    const geneTail: string | undefined = cfg?.gene_file_tail;

    for (const [relPath, parsed] of contentByPath.entries()) {
      const name = relPath.split("/").pop() || relPath;
      if (!name.toLowerCase().endsWith(".json")) continue;

      const lower = name.toLowerCase();

      const isGene =
        (geneTail &&
          lower.endsWith(`_${String(geneTail).toLowerCase()}.json`)) ||
        lower.includes("gene") ||
        lower.includes("structure") ||
        lower.includes("id0");

      if (!isGene) continue;
      if (!Array.isArray(parsed)) continue;

      let key: string | null = null;
      if (
        geneTail &&
        lower.endsWith(`_${String(geneTail).toLowerCase()}.json`)
      ) {
        key = name.replace(new RegExp(`_${geneTail}\\.json$`, "i"), "");
      } else {
        key = inferLabelKey(name);
      }

      if (!key) continue;
      (data.gene_data as any)[key] = parsed as any;
    }
  }

  onProgress?.(done, total, "Collecting contour_data…");

  // 2) contour files: *_contour.json
  for (const [relPath, parsed] of contentByPath.entries()) {
    const name = relPath.split("/").pop() || relPath;
    if (!name.toLowerCase().endsWith("_contour.json")) continue;
    if (!isObject(parsed)) continue;
    const key = name.replace(/_contour\.json$/i, "");
    (data.contour_data as any)[key] = parsed as any;
  }

  onProgress?.(done, total, "Collecting background masks…");

  // 3) background masks: *_background.json
  for (const [relPath, parsed] of contentByPath.entries()) {
    const name = relPath.split("/").pop() || relPath;
    if (!name.toLowerCase().endsWith("_background.json")) continue;
    if (!isObject(parsed)) continue;
    const key = name.replace(/_background\.json$/i, "");
    (data.perLabelBackgroundMaskData as any)[key] = parsed as any;
  }

  onProgress?.(done, total, "Collecting membership…");

  // 4) membership.json
  {
    const found = Array.from(contentByPath.keys()).find((k) =>
      k.toLowerCase().endsWith("membership.json"),
    );
    if (found) {
      const parsed = contentByPath.get(found);
      if (isObject(parsed)) data.membership = parsed as any;
    }
  }

  onProgress?.(done, total, "Collecting projections…");

  // 5) projections: XY_projections.json, ...
  for (const plane of ["XY", "XZ", "YZ"] as const) {
    const found = Array.from(contentByPath.keys()).find((k) =>
      k.toLowerCase().endsWith(`${plane.toLowerCase()}_projections.json`),
    );
    if (!found) continue;
    const parsed = contentByPath.get(found);
    if (isObject(parsed)) (data.projectionData as any)[plane] = parsed as any;
  }

  onProgress?.(done, total, "Collecting temporal data…");

  // 6) temporal: load ALL <chr>_temporal_data.json (normalize to TemporalTrendData)
  {
    const sp0 = speciesKeys[0];
    const timepoints: string[] = (metaTyped as any)?.[sp0]?.timepoints ?? [];

    const temporalFiles = Array.from(contentByPath.keys()).filter((k) =>
      k.toLowerCase().endsWith("_temporal_data.json"),
    );

    const byChr: Record<string, any> = {};

    for (const fp of temporalFiles) {
      const parsed = contentByPath.get(fp);
      if (!Array.isArray(parsed)) continue;

      const rawRows = parsed as any[];
      const chr = (fp.split("/").pop() || "").replace(
        /_temporal_data\.json$/i,
        "",
      );

      const rows = rawRows.map((r) => {
        const expr_delta_by_time: Record<string, number | null> = {};
        const acc_delta_by_time: Record<string, number | null> = {};

        for (const tp of timepoints) {
          const exprKey = `expr_delta_${tp}`;
          const accKey = `acc_delta_${tp}`;

          expr_delta_by_time[tp] = getNumberOrNull(r?.[exprKey]);
          acc_delta_by_time[tp] = getNumberOrNull(r?.[accKey]);
        }

        return {
          gene_id: r?.gene_id ? String(r.gene_id) : String(r?.gene_name ?? ""),
          gene_name: String(r?.gene_name ?? ""),
          agreement_class: r?.agreement_class,

          expr_delta_by_time,
          acc_delta_by_time,

          increase: getNumberOrNull(r?.increase),
          decrease: getNumberOrNull(r?.decrease),
          neutral: getNumberOrNull(r?.neutral),

          ...r,
        };
      });

      const byGeneName: Record<string, any> = {};
      for (const row of rows) {
        if (row?.gene_name) byGeneName[String(row.gene_name)] = row;
      }

      byChr[chr] = { chr, timepoints, rows, byGeneName };
    }

    // store all chromosomes
    (data as any).temporalTrendDataByChr = byChr;

    // keep existing single-field for backward compatibility (default chr)
    const defaultChr = (metaTyped as any)?.[sp0]?.chromosomes?.[0];
    if (defaultChr && byChr[defaultChr]) {
      data.temporalTrendData = byChr[defaultChr];
    }
  }

  onProgress?.(done, total, "Building gene_list…");

  // 7) gene_list
  {
    const found = Array.from(contentByPath.keys()).find((k) =>
      k.toLowerCase().endsWith("gene_list.json"),
    );
    if (found) {
      const parsed = contentByPath.get(found);
      if (Array.isArray(parsed)) data.gene_list = parsed.map(String).sort();
    }
    if (!data.gene_list.length) {
      const firstKey = Object.keys(data.gene_data as any)[0];
      const firstArr: any[] = (data.gene_data as any)?.[firstKey] ?? [];
      if (firstArr.length) {
        data.gene_list = firstArr
          .map((d) => d?.gene_name)
          .filter(Boolean)
          .map(String)
          .sort();
      }
    }
  }

  onProgress?.(done, total, "Deriving edges/paths…");

  // 8) edges + paths: safe defaults
  for (const key of Object.keys(data.gene_data as any)) {
    const arr: any[] = (data.gene_data as any)[key] ?? [];
    const length = Array.isArray(arr) ? arr.length : 0;
    if (length <= 1) {
      (data.gene_edges as any)[key] = [];
      (data.gene_paths as any)[key] = [];
      continue;
    }
    (data.gene_edges as any)[key] = Array.from(
      { length: length - 1 },
      (_, i) => ({
        source: i,
        target: i + 1,
      }),
    );
    (data.gene_paths as any)[key] = [Array.from({ length }, (_, i) => i)];
  }

  onProgress?.(total, total, "Validating bundle…");

  const candidate: any = { meta: metaTyped, data };
  const v = validateBundle(candidate);
  if (!v.ok) {
    return {
      bundle: null,
      issues: [...issues, ...v.issues],
      fileCount: all.length,
      metaFile: metaPath,
    };
  }

  onProgress?.(total, total, "Ready");

  return {
    bundle: candidate as Bundle,
    issues,
    fileCount: all.length,
    metaFile: metaPath,
  };
}

export function DataSetupWizard({
  onCancel,
  onComplete,
}: DataSetupWizardProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadMode, setUploadMode] = useState<UploadMode>("bundle");
  const [fileName, setFileName] = useState<string>("");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [folderInfo, setFolderInfo] = useState<null | {
    fileCount: number;
    metaFile?: string;
  }>(null);

  const [loadStage, setLoadStage] = useState<
    | "idle"
    | "reading"
    | "parsing"
    | "validating"
    | "sending"
    | "ready"
    | "error"
  >("idle");

  const [progress, setProgress] = useState({
    total: 0,
    done: 0,
    pct: 0,
    label: "",
  });

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
    setLoadStage("reading");
    setProgress({ total: 1, done: 0, pct: 0, label: `Reading ${file.name}` });

    setFileName(file.name);
    setBundle(null);
    setIssues([]);
    setFolderInfo(null);

    try {
      const text = await file.text();
      setProgress({ total: 1, done: 1, pct: 100, label: "Parsed file" });

      setLoadStage("validating");
      const parsed = JSON.parse(text);
      const v = validateBundle(parsed);
      setIssues(v.issues);

      if (!v.ok) {
        setBundle(null);
        setLoadStage("error");
        setStep(3);
        return;
      }

      setBundle(parsed as Bundle);
      setLoadStage("ready");
      setStep(3);
    } catch (e) {
      setBundle(null);
      setIssues([
        {
          path: "",
          message: "Failed to parse JSON. Make sure the file is valid JSON.",
        },
      ]);
      setLoadStage("error");
      setStep(3);
    }
  };

  const handleFolder = async (fileList: FileList) => {
    setLoadStage("reading");
    setProgress({
      total: fileList.length,
      done: 0,
      pct: 0,
      label: "Preparing…",
    });

    setFileName("(folder upload)");
    setBundle(null);
    setIssues([]);
    setFolderInfo(null);

    // const total = fileList.length;

    const result = await buildBundleFromFolder(
      fileList,
      (done, totalJson, label) => {
        const pct = totalJson ? Math.round((done / totalJson) * 100) : 0;
        setProgress({ total: totalJson, done, pct, label });
        // stage heuristic
        if (done < totalJson) setLoadStage("reading");
        else setLoadStage("validating");
      },
    );

    setFolderInfo({ fileCount: result.fileCount, metaFile: result.metaFile });
    setIssues(result.issues);
    setBundle(result.bundle);

    if (result.bundle && result.issues.length === 0) setLoadStage("ready");
    else if (result.issues.length) setLoadStage("error");

    setStep(3);
  };

  const loadDataset = () => {
    if (!bundle) return;

    // 1) show loading overlay IMMEDIATELY (flush to DOM)
    flushSync(() => {
      setLoadStage("sending");
      setProgress({ total: 1, done: 0, pct: 0, label: "Loading into viewer…" });
    });

    // 2) defer the heavy stuff + navigation to the next task
    setTimeout(() => {
      try {
        const speciesKeys = Object.keys(bundle.meta || {});
        const sp0 = speciesKeys[0];
        const chr0 = (bundle.meta as any)?.[sp0]?.chromosomes?.[0];

        if (!sp0 || !chr0) {
          flushSync(() => setLoadStage("error"));
          alert(
            "Invalid meta: must include at least one species and one chromosome.",
          );
          return;
        }

        dispatch(setSpecies(sp0));
        dispatch(setChromosome(chr0));
        dispatch(setExternalData(bundle.data));

        console.log(bundle.data);

        console.log(
          "[user data] externalData.temporalTrendData:",
          bundle.data.temporalTrendData,
        );
        console.log(
          "[user data] temporal rows:",
          bundle.data.temporalTrendData?.rows?.length,
        );
        console.log(
          "[user data] temporal byGeneName size:",
          bundle.data.temporalTrendData?.byGeneName
            ? Object.keys(bundle.data.temporalTrendData.byGeneName).length
            : 0,
        );

        // navigate to genome interface
        onComplete(bundle.meta);
      } catch (e) {
        flushSync(() => setLoadStage("error"));
        alert("Failed to load dataset. Check console for details.");
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }, 0);
  };

  const ProgressBox = () => {
    if (loadStage === "idle") return null;
    if (loadStage === "ready") return null;

    const stageText =
      loadStage === "reading"
        ? "Loading files…"
        : loadStage === "parsing"
          ? "Parsing…"
          : loadStage === "validating"
            ? "Validating…"
            : loadStage === "sending"
              ? "Loading dataset…"
              : loadStage === "error"
                ? "Error"
                : "Working…";

    return (
      <div className="mt-4 rounded-md border border-gray-700 bg-gray-900 p-3">
        <div className="text-sm text-gray-200">
          {stageText}{" "}
          <span className="text-gray-400">
            {progress.label ? `— ${progress.label}` : ""}
          </span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-800">
          <div
            className="h-2 bg-green-500 transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>

        <div className="mt-1 text-xs text-gray-400">
          {progress.total > 0 ? (
            <>
              {progress.done}/{progress.total} ({progress.pct}%)
            </>
          ) : (
            "…"
          )}
        </div>
      </div>
    );
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
                  <span className="text-gray-200">
                    perLabelBackgroundMaskData
                  </span>
                  , <span className="text-gray-200">gene_edges</span>,{" "}
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
            {/* Mode toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setUploadMode("bundle")}
                className={`px-3 py-1.5 rounded-md border transition ${
                  uploadMode === "bundle"
                    ? "border-sky-400/70 bg-sky-500/15 text-sky-100"
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                }`}
              >
                Single JSON bundle
              </button>
              <button
                onClick={() => setUploadMode("folder")}
                className={`px-3 py-1.5 rounded-md border transition ${
                  uploadMode === "folder"
                    ? "border-sky-400/70 bg-sky-500/15 text-sky-100"
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                }`}
              >
                Folder of JSON outputs
              </button>
            </div>

            {uploadMode === "bundle" && (
              <>
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
                        <span className="text-gray-300">
                          genomevis_bundle.json
                        </span>
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
              </>
            )}

            {uploadMode === "folder" && (
              <>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900/60
                             hover:bg-gray-800/60 hover:border-gray-500 transition px-5 py-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                      <span className="text-sky-300 text-lg">📁</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        Click to choose a folder
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Folder must contain{" "}
                        <span className="text-gray-300">data_info.json</span>{" "}
                        and your JSON outputs.
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tip: select the{" "}
                        <code className="text-gray-300">dataroot/</code> folder
                        if you have it.
                      </div>
                    </div>
                  </div>
                </button>

                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory is supported by Chromium/Safari
                  webkitdirectory="true"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const fl = e.target.files;
                    if (fl && fl.length) handleFolder(fl);
                    e.target.value = "";
                  }}
                />
              </>
            )}

            <ProgressBox />

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

            {folderInfo && (
              <div className="text-xs text-gray-400">
                Folder JSON files:{" "}
                <span className="texttext-gray-200">
                  {folderInfo.fileCount}
                </span>
                {folderInfo.metaFile ? (
                  <>
                    {" "}
                    · meta:{" "}
                    <span className="text-gray-200">{folderInfo.metaFile}</span>
                  </>
                ) : null}
              </div>
            )}

            <ProgressBox />

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
                disabled={
                  !bundle || issues.length > 0 || loadStage === "sending"
                }
                onClick={loadDataset}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !bundle || issues.length > 0 || loadStage === "sending"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                {loadStage === "sending" ? "Loading…" : "Load dataset"}
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
      {loadStage === "sending" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="text-lg font-semibold text-white">
              Loading dataset…
            </div>
            <div className="mt-1 text-sm text-gray-400">
              Building views. This can take a moment for large datasets.
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded bg-gray-800">
              <div className="h-2 w-1/2 animate-pulse bg-sky-500" />
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Please don’t refresh the page.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
