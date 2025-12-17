/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import type { GeneBarCodeProps } from "../../types/data_types_interfaces";
import { AGREEMENT_COLORS } from "../../utilFunctions/colorForViews";

function clip01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function divergingColor(v: number, vmax: number) {
  const t = vmax > 0 ? clip01(Math.abs(v) / vmax) : 0;
  const pos = [249, 115, 22];
  const neg = [14, 165, 233];
  const base = v >= 0 ? pos : neg;
  const mix = (c: number) => Math.round(2 + t * (c - 2));
  return `rgb(${mix(base[0])},${mix(base[1])},${mix(base[2])})`;
}

export const GeneBarCode: React.FC<GeneBarCodeProps> = ({
  points,
  timepoints,
  maxGenes,
  sortMode,
  onHover,
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

  const rows = useMemo(() => {
    const base = points
      .filter(
        (p) => p.row && p.row.expr_delta_by_time && p.row.acc_delta_by_time
      )
      .map((p) => p as any);

    const key = (p: any) => {
      const e = p.expr;
      const a = p.acc;
      if (sortMode === "expr") return Math.abs(e);
      if (sortMode === "acc") return Math.abs(a);
      return Math.abs(e) + Math.abs(a);
    };

    return base
      .sort((a, b) => key(b) - key(a))
      .slice(0, Math.max(10, maxGenes));
  }, [points, maxGenes, sortMode]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size.w || !size.h) return;

    const W = size.w;
    // const H = size.h;
    const sel = d3.select(svg);
    sel.selectAll("*").remove();

    const leftW = 140;
    const padX = 8;
    const rowH = 16;
    const top = 10;
    // const n = Math.min(rows.length, Math.floor((H - top - 6) / rowH));
    const n = rows.length;

    const bottomPad = 12;
    const svgH = top + 6 + n * rowH + bottomPad;

    // IMPORTANT: make SVG tall so the wrapper can scroll
    sel.attr("height", svgH);

    sel.attr("width", W);

    const allVals: number[] = [];
    for (const r of rows) {
      for (const tp of timepoints) {
        const e = r.row.expr_delta_by_time[tp];
        const a = r.row.acc_delta_by_time[tp];
        if (typeof e === "number") allVals.push(Math.abs(e));
        if (typeof a === "number") allVals.push(Math.abs(a));
      }
    }
    const vmax = d3.max(allVals) ?? 1;

    const gridW = W - leftW - padX * 2;
    const colW = gridW / Math.max(1, timepoints.length);

    const header = sel
      .append("g")
      .attr("transform", `translate(${leftW + padX}, ${top - 2})`);

    header
      .selectAll("text")
      .data(timepoints)
      .enter()
      .append("text")
      .attr("x", (_, i) => i * colW + colW / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
      .text((d) => d);

    const g = sel.append("g").attr("transform", `translate(0, ${top + 6})`);

    for (let i = 0; i < n; i++) {
      const r = rows[i];
      const y0 = i * rowH;

      g.append("text")
        .attr("x", leftW - 6)
        .attr("y", y0 + 11)
        .attr("text-anchor", "end")
        .attr("fill", AGREEMENT_COLORS[r.agreement] ?? "#cbd5e1")
        .attr("font-size", 11)
        .text(r.gene);

      for (let j = 0; j < timepoints.length; j++) {
        const tp = timepoints[j];
        const e = r.row.expr_delta_by_time[tp] ?? 0;
        const a = r.row.acc_delta_by_time[tp] ?? 0;
        const x0 = leftW + padX + j * colW;

        g.append("rect")
          .attr("x", x0)
          .attr("y", y0 + 2)
          .attr("width", colW - 2)
          .attr("height", rowH - 4)
          .attr("rx", 2)
          .attr("fill", "none")
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 1);

        // expr (top half)
        g.append("rect")
          .attr("x", x0 + 1)
          .attr("y", y0 + 3)
          .attr("width", colW - 4)
          .attr("height", (rowH - 6) / 2)
          .attr("fill", divergingColor(e, vmax))
          .attr("opacity", 0.95);

        // acc (bottom half)
        g.append("rect")
          .attr("x", x0 + 1)
          .attr("y", y0 + 3 + (rowH - 6) / 2)
          .attr("width", colW - 4)
          .attr("height", (rowH - 6) / 2)
          .attr("fill", divergingColor(a, vmax))
          .attr("opacity", 0.95);

        // interaction overlay
        const overlay = g
          .append("rect")
          .attr("x", x0)
          .attr("y", y0 + 2)
          .attr("width", colW - 2)
          .attr("height", rowH - 4)
          .attr("fill", "transparent")
          .on("mouseenter", () => onHover(r.idx))
          .on("mouseleave", () => onHover(null))
          .on("click", () => onClickGene(r.gene));

        overlay.append("title").text(() => {
          const ee = typeof e === "number" ? e.toFixed(3) : "NA";
          const aa = typeof a === "number" ? a.toFixed(3) : "NA";
          return `${r.gene}\nclass: ${r.agreement}\n${tp}\nExpr Δ: ${ee}\nAcc Δ: ${aa}`;
        });
      }
    }
  }, [rows, timepoints, size.w, size.h, onHover, onClickGene]);

  return (
    <div ref={wrapRef} className="w-full h-full overflow-auto">
      {/* <svg ref={svgRef} className="w-full h-full block" /> */}
      <svg ref={svgRef} className="w-full block" />
    </div>
  );
};
