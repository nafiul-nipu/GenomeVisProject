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
  BundleType,
  DataUploadMode,
  DataValidationIssue,
} from "../types/data_types_interfaces";

import { setSpecies, setChromosome } from "../redux-store/uiSlice";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function validateBundle(parsed: any): {
  ok: boolean;
  issues: DataValidationIssue[];
} {
  const issues: DataValidationIssue[] = [];

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

function makeTemplate(): BundleType {
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
  bundle: BundleType | null;
  issues: DataValidationIssue[];
  fileCount: number;
  metaFile?: string;
}> {
  const issues: DataValidationIssue[] = [];
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
    bundle: candidate as BundleType,
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

  const [helpOpen, setHelpOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadMode, setUploadMode] = useState<DataUploadMode>("folder");
  const [fileName, setFileName] = useState<string>("");
  const [bundle, setBundle] = useState<BundleType | null>(null);
  const [issues, setIssues] = useState<DataValidationIssue[]>([]);
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

      setBundle(parsed as BundleType);
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

        // console.log(bundle.data);

        // console.log(
        //   "[user data] externalData.temporalTrendData:",
        //   bundle.data.temporalTrendData,
        // );
        // console.log(
        //   "[user data] temporal rows:",
        //   bundle.data.temporalTrendData?.rows?.length,
        // );
        // console.log(
        //   "[user data] temporal byGeneName size:",
        //   bundle.data.temporalTrendData?.byGeneName
        //     ? Object.keys(bundle.data.temporalTrendData.byGeneName).length
        //     : 0,
        // );

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
            <span className="text-gray-200">
              precomputed outputs generated with MPASE
            </span>
            . MPASE runs offline to produce aligned 3D structures and shape
            abstractions.
            <a
              href="https://github.com/nafiul-nipu/MPASE"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-sky-400 hover:text-sky-300 underline"
            >
              Learn more
            </a>
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
                Label naming convention (required)
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

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition text-sm"
              >
                Download JSON template
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHelpOpen(true)}
                  className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition text-sm"
                >
                  Help: data format
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 transition text-sm font-medium"
                >
                  Continue
                </button>
              </div>
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
                        <code className="text-gray-300">
                          dataroot/green_monkey
                        </code>{" "}
                        folder if you have it.
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

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onMouseDown={() => setHelpOpen(false)}
        >
          <div
            className="h-full w-full grid place-items-center p-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-800">
                <div>
                  <div className="text-lg font-semibold text-white">
                    How to set up your data
                  </div>
                  <div className="text-xs text-gray-500">
                    GenomeVis visualizes{" "}
                    <span className="text-gray-300">
                      precomputed outputs generated using MPASE
                    </span>
                    . MPASE is used offline to extract{" "}
                    <span className="text-gray-300">
                      3D aligned genome structures
                    </span>
                    ,
                    <span className="text-gray-300">2D shape abstractions</span>
                    , and
                    <span className="text-gray-300">
                      gene–shape relationships
                    </span>
                    . GenomeVis does <strong>not</strong> run MPASE in the
                    browser.
                    <span className="ml-1">
                      MPASE pipeline:
                      <a
                        href="https://github.com/nafiul-nipu/MPASE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-sky-400 hover:text-sky-300 underline"
                      >
                        github.com/nafiul-nipu/MPASE
                      </a>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setHelpOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800 transition text-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-6 max-h-[75vh] overflow-auto">
                {/* Overview */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    What GenomeVis shows
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                    <li>
                      <span className="text-gray-200">3D Genome view</span>:
                      requires gene coordinate JSON files.
                    </li>
                    <li>
                      <span className="text-gray-200">2D Shape views</span>:
                      require contour + background + membership (optional but
                      recommended).
                    </li>
                    <li>
                      <span className="text-gray-200">
                        Temporal dynamics views
                      </span>
                      : require per-chromosome temporal JSON files.
                    </li>
                  </ul>
                  <div className="text-xs text-gray-500">
                    GenomeVis visualizes precomputed outputs only — it does not
                    run{" "}
                    <a
                      href="https://github.com/nafiul-nipu/MPASE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-sky-400 hover:text-sky-300 underline"
                    >
                      MPASE
                    </a>{" "}
                    in the browser. Use MPASE to extract 3D aligned points and
                    data related to shape analysis
                  </div>
                </section>

                {/* Folder mode */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    Recommended: Folder of JSON outputs
                  </div>
                  <div className="text-sm text-gray-400">
                    Select any folder that contains{" "}
                    <code className="text-gray-200">data_info.json</code> and
                    the JSON outputs. Folder structure can be nested — GenomeVis
                    scans recursively.
                  </div>

                  <pre className="rounded-lg bg-black/40 p-3 text-xs text-gray-300 overflow-auto">
                    {`dataroot/
├─ data_info.json                      (required)
├─ gene_data/                          (required for 3D Genome view)
│  ├─ chr1_12hrs_untr_gene_info.json
│  ├─ chr1_12hrs_inf_gene_info.json
│  └─ ...
├─ temporal_data/                      (required for Temporal views)
│  ├─ chr1_temporal_data.json
│  ├─ chr2_temporal_data.json
│  └─ ...
├─ shape_data/                         (optional: enables Shape views)
│  ├─ chr1_12hrs_untr_contour.json
│  ├─ chr1_12hrs_untr_background.json
│  └─ ...
└─ membership.json                     (optional: enables shape↔gene linking)`}
                  </pre>

                  <div className="text-xs text-gray-500">
                    Tip: You may place files anywhere (flat or nested). Only
                    filenames and internal keys matter.
                  </div>
                </section>

                {/* Label naming */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    Label naming convention
                  </div>
                  <div className="text-sm text-gray-400">
                    Many files are keyed by:
                    <span className="ml-2">
                      <code className="text-gray-200">{`<chromosome>_<timepoint>_<condition>`}</code>
                    </span>
                  </div>

                  <pre className="rounded-lg bg-black/40 p-3 text-xs text-gray-300 overflow-auto">
                    {`Examples:
  chr1_12hrs_untr
  chr1_12hrs_inf
  chr2_18hrs_untr

These must match strings in data_info.json:
  chromosomes: ["chr1", "chr2", ...]
  timepoints:  ["12hrs", "18hrs", "24hrs"]
  before_name: "untr"
  after_name:  "inf"`}
                  </pre>
                </section>

                {/* data_info.json */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    data_info.json (required)
                  </div>
                  <div className="text-sm text-gray-400">
                    This file defines your dataset “contract”. Values here must
                    match your filenames and temporal keys.
                  </div>

                  <pre className="rounded-lg bg-black/40 p-3 text-xs text-gray-300 overflow-auto">
                    {`{
  "green_monkey": {
    "chromosomes": ["chr1", "chr2", "chr3"],
    "timepoints": ["12hrs", "18hrs", "24hrs"],
    "before_name": "untr",
    "after_name": "inf",

    // optional but recommended (used by folder loader)
    "gene_file_tail": "gene_info",

    // optional (used by coordinate picking)
    "gene_position_to_use": "aligned"
  }
}`}
                  </pre>

                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      <span className="text-gray-200">chromosomes</span>:
                      chromosomes shown in the UI selector.
                    </div>
                    <div>
                      <span className="text-gray-200">timepoints</span>: must
                      match temporal field suffixes (below).
                    </div>
                    <div>
                      <span className="text-gray-200">
                        before_name / after_name
                      </span>
                      : condition strings used in labels.
                    </div>
                    <div>
                      <span className="text-gray-200">gene_file_tail</span>:
                      identifies gene coordinate files by suffix.
                    </div>
                    <div>
                      <span className="text-gray-200">
                        gene_position_to_use
                      </span>
                      :{" "}
                      <code className="text-gray-200 ml-2">
                        "aligned" | "middle" | "start" | "end"
                      </code>
                    </div>
                  </div>
                </section>

                {/* 3D Genome view */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    3D Genome view data (required)
                  </div>
                  <div className="text-sm text-gray-400">
                    Gene coordinate files must be JSON arrays of gene rows. Each
                    row must include{" "}
                    <code className="text-gray-200">gene_name</code> and
                    coordinates for the chosen position mode.
                  </div>

                  <pre className="rounded-lg bg-black/40 p-3 text-xs text-gray-300 overflow-auto">
                    {`// Example: chr1_12hrs_untr_gene_info.json
[
  { "gene_name": "GENE_A", "aligned_pos": [0.12, -1.3, 2.1] },
  { "gene_name": "GENE_B", "aligned_pos": [-0.5, 0.2, 1.7] }
]`}
                  </pre>

                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="text-gray-200">
                      Supported coordinate fields:
                    </div>
                    <ul className="list-disc pl-5 text-gray-400 space-y-1">
                      <li>
                        <code className="text-gray-200">
                          aligned_pos: [x,y,z]
                        </code>{" "}
                        (preferred)
                      </li>
                      <li>
                        <code className="text-gray-200">
                          middle_x/middle_y/middle_z
                        </code>{" "}
                        or{" "}
                        <code className="text-gray-200">middle: [x,y,z]</code>
                      </li>
                      <li>
                        <code className="text-gray-200">
                          start_x/start_y/start_z
                        </code>
                      </li>
                      <li>
                        <code className="text-gray-200">end_x/end_y/end_z</code>
                      </li>
                      <li>
                        Some datasets use{" "}
                        <code className="text-gray-200">x/y/z</code>.
                      </li>
                    </ul>
                    <div className="text-xs text-gray-500">
                      Position mode is chosen from{" "}
                      <code className="text-gray-300">
                        data_info.json → gene_position_to_use
                      </code>
                      .
                    </div>
                  </div>
                </section>

                {/* 2D Shape views */}
                <section className="space-y-4">
                  <div className="text-sm font-medium text-gray-200">
                    2D Shape views data (optional but recommended)
                  </div>

                  <ul className="list-disc pl-5 text-sm text-gray-400 space-y-3">
                    <li>
                      <div>
                        <code className="text-gray-200">{`<label>_contour.json`}</code>{" "}
                        <span className="text-gray-500">
                          → enables contour overlays
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        2D contour geometry for a specific label (example:{" "}
                        <code className="text-gray-300">
                          chr1_12hrs_untr_contour.json
                        </code>
                        ).
                      </div>
                    </li>

                    <li>
                      <div>
                        <code className="text-gray-200">{`<label>_background.json`}</code>{" "}
                        <span className="text-gray-500">
                          → enables background mask overlays
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Must share the same{" "}
                        <code className="text-gray-300">&lt;label&gt;</code> as
                        the contour file.
                      </div>
                    </li>

                    <li>
                      <div>
                        <code className="text-gray-200">membership.json</code>{" "}
                        <span className="text-gray-500">
                          → enables shape↔gene linking
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-2">
                        <div>
                          Per-label membership mapping that connects genes to
                          shape regions (HDR / point-fraction) for each plane
                          (XY/XZ/YZ).
                        </div>

                        <pre className="rounded bg-black/40 p-2 text-[11px] text-gray-300 overflow-auto">
                          {`{
  "<label>": {
    "points": N,
    "ids": [...],
    "planes": {
      "XY": {
        "pixels": [[x,y], ...],
        "hdr": { "100": [0,1,5], "95": [0,2] },
        "point_fraction": { ... }
      }
    }
  }
}`}
                        </pre>

                        <div className="text-xs text-gray-600">
                          Indices inside{" "}
                          <code className="text-gray-300">hdr</code> /{" "}
                          <code className="text-gray-300">point_fraction</code>{" "}
                          refer to positions in{" "}
                          <code className="text-gray-300">ids</code> and{" "}
                          <code className="text-gray-300">pixels</code>.
                        </div>
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Temporal dynamics views */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    Temporal dynamics views data (required for those views)
                  </div>

                  <div className="text-sm text-gray-400">
                    For each chromosome, provide:
                    <code className="text-gray-200 ml-2">{`<chr>_temporal_data.json`}</code>
                    as a JSON array (one row per gene).
                  </div>

                  <pre className="rounded-lg bg-black/40 p-3 text-xs text-gray-300 overflow-auto">
                    {`// Example: chr1_temporal_data.json
[
  {
    "gene_name": "GENE_A",
    "agreement_class": "agree_up",
    "expr_delta_12hrs": 0.42,
    "expr_delta_18hrs": 0.11,
    "expr_delta_24hrs": -0.08,
    "acc_delta_12hrs": 0.18,
    "acc_delta_18hrs": 0.05,
    "acc_delta_24hrs": -0.02
  }
]`}
                  </pre>

                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      The suffixes (
                      <code className="text-gray-200">12hrs/18hrs/24hrs</code>)
                      must match{" "}
                      <code className="text-gray-200">
                        data_info.json → timepoints
                      </code>
                      .
                    </div>
                    <div>
                      Required per row:{" "}
                      <code className="text-gray-200">gene_name</code>,{" "}
                      <code className="text-gray-200">{`expr_delta_<timepoint>`}</code>
                      ,{" "}
                      <code className="text-gray-200">{`acc_delta_<timepoint>`}</code>
                      .
                    </div>
                  </div>
                </section>

                {/* Other optional */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">
                    Other optional files
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-400 space-y-2">
                    <li>
                      <div>
                        <code className="text-gray-200">gene_list.json</code>{" "}
                        <span className="text-gray-500">
                          → improves dropdown UX
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Optional explicit list of gene names for dropdowns. If
                        missing, GenomeVis derives it from the first loaded gene
                        coordinate file.
                      </div>
                    </li>
                  </ul>

                  <div className="text-xs text-gray-500">
                    If a file is missing or misnamed, the corresponding view
                    will simply be empty (no crash).
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-800 flex items-center justify-end">
                <button
                  onClick={() => setHelpOpen(false)}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 transition text-sm font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
