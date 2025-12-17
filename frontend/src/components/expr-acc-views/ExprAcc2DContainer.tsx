import React, { useMemo } from "react";
import * as d3 from "d3";
import type {
  TemporalTrendRow,
  AgreementClass,
  DeltaMode,
  ExprAcc2DContainerProps,
  GeneScatterPoints,
  BarcodePoint,
  BarcodeSort,
} from "../../types/data_types_interfaces";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import {
  setHoveredGene,
  setSelectedGenes,
  setTemporal2DMaxGenes,
  setTemporal2DBarcodeSort,
  setTemporal2DDeltaMode,
} from "../../redux-store/uiSlice";

import { ExprAccScatter } from "./ExprAccScatter";
import { GeneBarCode } from "./GeneBarCode";

function summarizeDelta(
  valsByTime: Record<string, number | null>,
  timepoints: string[],
  mode: DeltaMode
): number | null {
  const vals = timepoints
    .map((tp) => valsByTime?.[tp] ?? null)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  if (!vals.length) return null;

  if (mode === "last") return vals[vals.length - 1];
  if (mode === "peakAbs") {
    let best = vals[0];
    let bestAbs = Math.abs(best);
    for (const v of vals) {
      const a = Math.abs(v);
      if (a > bestAbs) {
        bestAbs = a;
        best = v;
      }
    }
    return best;
  }
  return d3.mean(vals) ?? null;
}

export const ExprAcc2DContainer: React.FC<ExprAcc2DContainerProps> = ({
  meta_data_typed,
}) => {
  const dispatch = useAppDispatch();
  const { species, chromosome, condTab, timeIdx } = useAppSelector((s) => s.ui);

  const temporal2DMaxGenes = useAppSelector((s) => s.ui.temporal2DMaxGenes);
  const temporal2DBarcodeSort = useAppSelector(
    (s) => s.ui.temporal2DBarcodeSort
  );
  const temporal2DDeltaMode = useAppSelector((s) => s.ui.temporal2DDeltaMode);

  const selectedGenes = useAppSelector((s) => s.ui.selectedGenes);
  const temporalFilter = useAppSelector((s) => s.ui.temporalClassFilter);

  const temporal =
    useAppSelector((s) => s.data.data?.temporalTrendData) ?? null;
  const temporalByGene = temporal?.byGeneName ?? {};

  // stable label for hoveredGene -> idx mapping (matches 3D/2D convention)
  const primaryLabel = useMemo(() => {
    const meta = meta_data_typed?.[species];
    const timepoints: string[] = meta?.timepoints ?? [];
    const before = (meta?.before_name ?? "before").toLowerCase();
    const after = (meta?.after_name ?? "after").toLowerCase();
    const tp = timepoints[timeIdx] ?? timepoints[0] ?? "";
    if (condTab === "diff") return `${chromosome}_${tp}_${before}`;
    const code = condTab === "before" ? before : after;
    return `${chromosome}_${tp}_${code}`;
  }, [meta_data_typed, species, chromosome, condTab, timeIdx]);

  const geneDataForPrimary =
    useAppSelector((s) => s.data.data?.gene_data?.[primaryLabel]) ?? [];

  const idxByGene = useMemo(() => {
    const m = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geneDataForPrimary.forEach((g: any, i: number) => m.set(g.gene_name, i));
    return m;
  }, [geneDataForPrimary]);

  const meta = meta_data_typed?.[species];
  const timepoints = useMemo(
    () => (meta?.timepoints ?? []).slice(0, 3),
    [meta]
  );

  const points = useMemo(() => {
    if (!temporal) {
      return [] as Array<{
        gene: string;
        idx: number;
        agreement: AgreementClass;
        expr: number;
        acc: number;
        row: TemporalTrendRow | null;
      }>;
    }

    const keep = temporalFilter.length
      ? new Set<AgreementClass>(temporalFilter)
      : null;

    const out: Array<{
      gene: string;
      idx: number;
      agreement: AgreementClass;
      expr: number;
      acc: number;
      row: TemporalTrendRow | null;
    }> = [];

    for (const row of temporal.rows) {
      const agreement = row.agreement_class;
      if (keep && !keep.has(agreement)) continue;

      const idx = idxByGene.get(row.gene_name);
      if (idx == null) continue;

      const expr = summarizeDelta(
        row.expr_delta_by_time,
        timepoints,
        temporal2DDeltaMode
      );
      const acc = summarizeDelta(
        row.acc_delta_by_time,
        timepoints,
        temporal2DDeltaMode
      );
      if (expr == null || acc == null) continue;

      out.push({ gene: row.gene_name, idx, agreement, expr, acc, row });
    }

    // include not_expressed ONLY when user asks for it (in filter)
    if (keep && keep.has("not_expressed")) {
      for (const g of geneDataForPrimary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (g as any).gene_name;
        if (temporalByGene[name]) continue;

        const idx = idxByGene.get(name);
        if (idx == null) continue;

        out.push({
          gene: name,
          idx,
          agreement: "not_expressed",
          expr: 0,
          acc: 0,
          row: null,
        });
      }
    }

    return out;
  }, [
    temporal,
    temporalFilter,
    idxByGene,
    temporal2DDeltaMode,
    timepoints,
    geneDataForPrimary,
    temporalByGene,
  ]);

  const toggleSelect = (gene: string) => {
    const next = selectedGenes.includes(gene)
      ? selectedGenes.filter((g) => g !== gene)
      : [...selectedGenes, gene];
    dispatch(setSelectedGenes(next));
  };

  // typed view inputs
  const scatterPoints: GeneScatterPoints[] = points.map((p) => ({
    gene: p.gene,
    idx: p.idx,
    agreement: p.agreement,
    expr: p.expr,
    acc: p.acc,
  }));

  const barcodePoints: BarcodePoint[] = points.map((p) => ({
    gene: p.gene,
    idx: p.idx,
    agreement: p.agreement,
    row: p.row,
    expr: p.expr,
    acc: p.acc,
  }));

  return (
    <div className="w-full h-full flex flex-col p-2">
      {/* controls row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <label className="flex items-center gap-1">
            Δ mode
            <select
              value={temporal2DDeltaMode}
              onChange={(e) =>
                dispatch(setTemporal2DDeltaMode(e.target.value as DeltaMode))
              }
              className="bg-transparent border border-gray-700 rounded px-1 py-0.5"
            >
              <option value="mean">mean</option>
              <option value="last">last</option>
              <option value="peakAbs">peakAbs</option>
            </select>
          </label>

          <span className="text-slate-500">|</span>

          <label className="flex items-center gap-1">
            barcode sort
            <select
              value={temporal2DBarcodeSort}
              onChange={(e) =>
                dispatch(
                  setTemporal2DBarcodeSort(e.target.value as BarcodeSort)
                )
              }
              className="bg-transparent border border-gray-700 rounded px-1 py-0.5"
            >
              <option value="abs">abs</option>
              <option value="expr">expr</option>
              <option value="acc">acc</option>
            </select>
          </label>

          <label className="flex items-center gap-1">
            max
            <input
              type="number"
              min={25}
              max={2000}
              value={temporal2DMaxGenes}
              onChange={(e) =>
                dispatch(setTemporal2DMaxGenes(Number(e.target.value) || 250))
              }
              className="w-20 bg-transparent border border-gray-700 rounded px-1 py-0.5"
            />
          </label>
        </div>
      </div>

      {/* side-by-side views */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* Scatter */}
        <div className="min-h-0 rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden flex flex-col">
          <div className="px-2 py-1 text-xs text-slate-300 border-b border-gray-800">
            Expr Δ vs Acc Δ
          </div>
          <div className="flex-1 min-h-0">
            <ExprAccScatter
              points={scatterPoints}
              onHover={(idx) =>
                dispatch(
                  setHoveredGene(
                    idx == null ? null : { label: primaryLabel, idx }
                  )
                )
              }
              onClickGene={toggleSelect}
            />
          </div>
        </div>

        {/* Barcode */}
        <div className="min-h-0 rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden flex flex-col">
          <div className="px-2 py-1 text-xs text-slate-300 border-b border-gray-800">
            Temporal barcode (expr top, acc bottom)
          </div>
          <div className="flex-1 min-h-0">
            <GeneBarCode
              points={barcodePoints}
              timepoints={timepoints}
              maxGenes={temporal2DMaxGenes}
              sortMode={temporal2DBarcodeSort as BarcodeSort}
              onHover={(idx) =>
                dispatch(
                  setHoveredGene(
                    idx == null ? null : { label: primaryLabel, idx }
                  )
                )
              }
              onClickGene={toggleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
