/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import type { GeneBarCodeProps } from "../../types/data_types_interfaces";
import { AGREEMENT_COLORS } from "../../utilFunctions/colorForViews";

function signColor(v: number) {
  return v >= 0 ? "rgb(14,165,233)" : "rgb(249,115,22)"; // neg orange, pos cyan
}

export const GeneExprAccBarsLinesAgreement: React.FC<GeneBarCodeProps> = ({
  points,
  timepoints,
  maxGenes,
  sortMode,
  selectedGenes,
  onClickGene,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // selected first (in selectedGenes order), then rest sorted
  const rows = useMemo(() => {
    const base = points
      .filter(
        (p) => p.row && p.row.expr_delta_by_time && p.row.acc_delta_by_time
      )
      .map((p) => p as any);

    const byGene = new Map<string, any>();
    base.forEach((p) => byGene.set(p.gene, p));

    const key = (p: any) => {
      const e = p.expr;
      const a = p.acc;
      if (sortMode === "expr") return Math.abs(e);
      if (sortMode === "acc") return Math.abs(a);
      return Math.abs(e) + Math.abs(a);
    };

    const selectedRows = selectedGenes
      .map((g) => byGene.get(g))
      .filter(Boolean);
    const selectedSet = new Set(selectedGenes);

    const rest = base
      .filter((p) => !selectedSet.has(p.gene))
      .sort((a, b) => key(b) - key(a));

    return [...selectedRows, ...rest].slice(0, Math.max(10, maxGenes));
  }, [points, maxGenes, sortMode, selectedGenes]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size.w || !size.h) return;

    const W = size.w;
    const sel = d3.select(svg);
    sel.selectAll("*").remove();

    // tooltip (HTML)
    const wrap = wrapRef.current;
    let tip: HTMLDivElement | null = null;
    if (wrap) {
      const old = wrap.querySelector(".genegrid-tooltip");
      if (old) old.remove();

      tip = document.createElement("div");
      tip.className =
        "genegrid-tooltip pointer-events-none absolute z-50 rounded-md border border-gray-700 bg-gray-900/90 px-2 py-1 text-xs text-slate-100 shadow";
      tip.style.display = "none";
      wrap.style.position = "relative";
      wrap.appendChild(tip);
    }

    // ---- responsive column layout (FIT TO DIV) ----
    const padL = 8;
    const padR = 8;
    const gap = 10;

    const geneW = 130;
    const exprBarW = 88; // barcode cell width
    const accBarW = 88; // barcode cell width
    const classW = 92;

    const fixed =
      padL + geneW + gap + exprBarW + gap + accBarW + gap + classW + padR;

    const lineW = Math.max(140, W - fixed);

    const xGene = padL;
    const xExpr = xGene + geneW + gap;
    const xAcc = xExpr + exprBarW + gap;
    const xLine = xAcc + accBarW + gap;
    const xClass = xLine + lineW + gap;

    // svg fills div width; no hidden class column
    sel.attr("width", W);

    const top = 18;
    const rowH = 30;
    const n = rows.length;
    const svgH = top + 16 + n * rowH + 16;
    sel.attr("height", svgH);

    // global vmax
    const allAbs: number[] = [];
    for (const r of rows) {
      if (typeof r.expr === "number") allAbs.push(Math.abs(r.expr));
      if (typeof r.acc === "number") allAbs.push(Math.abs(r.acc));
      for (const tp of timepoints) {
        const e = r.row?.expr_delta_by_time?.[tp];
        const a = r.row?.acc_delta_by_time?.[tp];
        if (typeof e === "number") allAbs.push(Math.abs(e));
        if (typeof a === "number") allAbs.push(Math.abs(a));
      }
    }
    const vmax = d3.max(allAbs) ?? 1;

    // headers (NO legend here; legend is in container header)
    const header = sel.append("g");
    const hy = 12;
    const headerText = (x: number, w: number, label: string) => {
      header
        .append("text")
        .attr("x", x + w / 2)
        .attr("y", hy)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(label);
    };

    headerText(xExpr, exprBarW, "Expr");
    headerText(xAcc, accBarW, "Acc");
    headerText(xLine, lineW, "Lines");
    headerText(xClass, classW, "Class");

    const g = sel.append("g").attr("transform", `translate(0, ${top})`);

    // timepoint X for line column
    const xTP = d3
      .scalePoint<string>()
      .domain(timepoints)
      .range([xLine + 8, xLine + lineW - 8])
      .padding(0.4);

    const mkLine = d3
      .line<{ tp: string; y: number }>()
      .x((d) => xTP(d.tp) ?? 0)
      .y((d) => d.y);

    for (let i = 0; i < n; i++) {
      const r = rows[i];
      const y0 = i * rowH;
      const isSel = selectedGenes.includes(r.gene);

      // row background for selection
      if (isSel) {
        g.append("rect")
          .attr("x", padL - 4)
          .attr("y", y0 + 3)
          .attr("width", W - padL - padR + 8)
          .attr("height", rowH - 6)
          .attr("rx", 4)
          .attr("fill", "rgba(255,255,255,0.06)");
      }

      // gene label
      g.append("text")
        .attr("x", xGene + geneW - 6)
        .attr("y", y0 + 20)
        .attr("text-anchor", "end")
        .attr(
          "fill",
          isSel ? "#ffffff" : AGREEMENT_COLORS[r.agreement] ?? "#cbd5e1"
        )
        .attr("font-weight", isSel ? 700 : 400)
        .attr("font-size", 12)
        .text(r.gene);

      // class text
      g.append("text")
        .attr("x", xClass + 2)
        .attr("y", y0 + 20)
        .attr("text-anchor", "start")
        .attr("fill", AGREEMENT_COLORS[r.agreement] ?? "#94a3b8")
        .attr("font-size", 11)
        .attr("font-weight", isSel ? 700 : 500)
        .text(String(r.agreement));

      // shared Y scale for barcodes (Expr + Acc): center at 0
      const yBar = d3
        .scaleLinear()
        .domain([-vmax, vmax])
        .range([y0 + 24, y0 + 6]);

      const yBarZero = yBar(0);

      // ===== Expr BARCODE: one bar per timepoint =====
      const xBarExpr = d3
        .scaleBand<string>()
        .domain(timepoints)
        .range([xExpr + 6, xExpr + exprBarW - 6])
        .paddingInner(0.35)
        .paddingOuter(0.2);

      // track
      g.append("rect")
        .attr("x", xExpr)
        .attr("y", y0 + 6)
        .attr("width", exprBarW)
        .attr("height", 18)
        .attr("rx", 2)
        .attr("fill", "rgba(148,163,184,0.10)");

      // 0 axis across barcode cell
      g.append("line")
        .attr("x1", xExpr + 4)
        .attr("x2", xExpr + exprBarW - 4)
        .attr("y1", yBarZero)
        .attr("y2", yBarZero)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1.4);

      for (const tp of timepoints) {
        const v = r.row?.expr_delta_by_time?.[tp] ?? 0;
        const x = xBarExpr(tp);
        if (x == null) continue;

        const y1 = yBar(v);
        g.append("rect")
          .attr("x", x)
          .attr("y", Math.min(y1, yBarZero))
          .attr("width", Math.max(2, xBarExpr.bandwidth()))
          .attr("height", Math.max(2, Math.abs(y1 - yBarZero)))
          .attr("rx", 1.5)
          .attr("fill", signColor(v))
          .attr("opacity", 0.95);
      }

      // ===== Acc BARCODE: one bar per timepoint =====
      const xBarAcc = d3
        .scaleBand<string>()
        .domain(timepoints)
        .range([xAcc + 6, xAcc + accBarW - 6])
        .paddingInner(0.35)
        .paddingOuter(0.2);

      g.append("rect")
        .attr("x", xAcc)
        .attr("y", y0 + 6)
        .attr("width", accBarW)
        .attr("height", 18)
        .attr("rx", 2)
        .attr("fill", "rgba(148,163,184,0.10)");

      g.append("line")
        .attr("x1", xAcc + 4)
        .attr("x2", xAcc + accBarW - 4)
        .attr("y1", yBarZero)
        .attr("y2", yBarZero)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1.4);

      for (const tp of timepoints) {
        const v = r.row?.acc_delta_by_time?.[tp] ?? 0;
        const x = xBarAcc(tp);
        if (x == null) continue;

        const y1 = yBar(v);
        g.append("rect")
          .attr("x", x)
          .attr("y", Math.min(y1, yBarZero))
          .attr("width", Math.max(2, xBarAcc.bandwidth()))
          .attr("height", Math.max(2, Math.abs(y1 - yBarZero)))
          .attr("rx", 1.5)
          .attr("fill", signColor(v))
          .attr("opacity", 0.95);
      }

      // ===== LINE COLUMN: BOTH LINES (expr + acc) =====
      const yLine = d3
        .scaleLinear()
        .domain([-vmax, vmax])
        .range([y0 + 24, y0 + 6]);

      const yZero = yLine(0);

      // 0 axis horizontal line in line cell
      g.append("line")
        .attr("x1", xLine + 6)
        .attr("x2", xLine + lineW - 6)
        .attr("y1", yZero)
        .attr("y2", yZero)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1.4);

      const exprSeries = timepoints.map((tp) => ({
        tp,
        y: yLine(r.row?.expr_delta_by_time?.[tp] ?? 0),
      }));
      const accSeries = timepoints.map((tp) => ({
        tp,
        y: yLine(r.row?.acc_delta_by_time?.[tp] ?? 0),
      }));

      // expr line: solid, bright
      g.append("path")
        .attr("d", mkLine(exprSeries as any) ?? "")
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", isSel ? 2.6 : 2.0)
        .attr("opacity", 0.98);

      // acc line: dashed, darker
      g.append("path")
        .attr("d", mkLine(accSeries as any) ?? "")
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", isSel ? 2.4 : 1.8)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.95);

      // markers: expr circles + acc squares
      for (const tp of timepoints) {
        const cx = xTP(tp) ?? 0;
        const ev = r.row?.expr_delta_by_time?.[tp] ?? 0;
        const av = r.row?.acc_delta_by_time?.[tp] ?? 0;

        g.append("circle")
          .attr("cx", cx)
          .attr("cy", yLine(ev))
          .attr("r", isSel ? 2.6 : 2.2)
          .attr("fill", "#e2e8f0");

        g.append("rect")
          .attr("x", cx - (isSel ? 2.6 : 2.2))
          .attr("y", yLine(av) - (isSel ? 2.6 : 2.2))
          .attr("width", isSel ? 5.2 : 4.4)
          .attr("height", isSel ? 5.2 : 4.4)
          .attr("fill", "#94a3b8");
      }

      // interaction overlay for row
      const overlay = g
        .append("rect")
        .attr("x", padL - 4)
        .attr("y", y0 + 3)
        .attr("width", W - padL - padR + 8)
        .attr("height", rowH - 6)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("click", () => onClickGene(r.gene));

      if (tip) {
        overlay
          .on("mousemove", (evt: any) => {
            const fmt = (v: any) =>
              v == null || !Number.isFinite(v) ? "NA" : Number(v).toFixed(3);

            const exprParts = timepoints.map((tp) => {
              const v = r.row?.expr_delta_by_time?.[tp];
              return `${tp}: ${fmt(v)}`;
            });

            const accParts = timepoints.map((tp) => {
              const v = r.row?.acc_delta_by_time?.[tp];
              return `${tp}: ${fmt(v)}`;
            });

            tip!.textContent =
              `${r.gene} | ${r.agreement}\n` +
              `ExprΔ: ${exprParts.join(" | ")}\n` +
              `AccΔ:  ${accParts.join(" | ")}`;

            tip!.style.whiteSpace = "pre"; // allow \n line breaks
            tip!.style.left = `${evt.offsetX + 12}px`;
            tip!.style.top = `${evt.offsetY + 12}px`;
            tip!.style.display = "block";
          })
          .on("mouseleave", () => {
            tip!.style.display = "none";
          });
      }
    }
  }, [
    rows,
    timepoints,
    size.w,
    size.h,
    onClickGene,
    selectedGenes,
    maxGenes,
    sortMode,
  ]);

  return (
    <div ref={wrapRef} className="w-full h-full overflow-auto">
      <svg ref={svgRef} className="w-full block" />
    </div>
  );
};
