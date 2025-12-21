/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import type { ExprAccScatterProps } from "../../types/data_types_interfaces";
import { AGREEMENT_COLORS } from "../../utilFunctions/colorForViews";

export const ExprAccScatter: React.FC<ExprAccScatterProps> = ({
  points,
  selectedGenes,
  onClickGene,
  onLasso,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
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

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size.w || !size.h) return;

    const W = size.w;
    const H = size.h;
    const M = { l: 42, r: 14, t: 14, b: 70 };

    const xs = points.map((p) => p.expr);
    const ys = points.map((p) => p.acc);
    const xExt = d3.extent(xs) as [number, number];
    const yExt = d3.extent(ys) as [number, number];
    const pad = 0.1;
    const xPad = (xExt[1] - xExt[0]) * pad || 1;
    const yPad = (yExt[1] - yExt[0]) * pad || 1;

    const x = d3
      .scaleLinear()
      .domain([xExt[0] - xPad, xExt[1] + xPad])
      .range([M.l, W - M.r]);

    const y = d3
      .scaleLinear()
      .domain([yExt[0] - yPad, yExt[1] + yPad])
      .range([H - M.b, M.t]);

    const sel = d3.select(svg);
    sel.selectAll("*").remove();

    sel
      .append("g")
      .attr("transform", `translate(0,${H - M.b})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#cbd5e1");

    sel
      .append("g")
      .attr("transform", `translate(${M.l},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#cbd5e1");

    sel
      .append("text")
      .attr("x", (M.l + (W - M.r)) / 2)
      .attr("y", H - 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 11)
      .text("Expression Δ");

    sel
      .append("text")
      .attr("x", 12)
      .attr("y", (M.t + (H - M.b)) / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 11)
      .attr("transform", `rotate(-90, 12, ${(M.t + (H - M.b)) / 2})`)
      .text("Accessibility Δ");

    sel
      .append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", M.t)
      .attr("y2", H - M.b)
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    sel
      .append("line")
      .attr("x1", M.l)
      .attr("x2", W - M.r)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    const g = sel.append("g");

    const selected = new Set(selectedGenes);

    // circles
    g.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.expr))
      .attr("cy", (d) => y(d.acc))
      .attr("r", (d) => (selected.has(d.gene) ? 4.0 : 2.6))
      .attr("fill", (d) => AGREEMENT_COLORS[d.agreement] ?? "#94a3b8")
      .attr("stroke", (d) => (selected.has(d.gene) ? "#ffffff" : "#020617"))
      .attr("stroke-width", (d) => (selected.has(d.gene) ? 1.6 : 0.8))
      .attr("opacity", 0.95)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", (evt, d: any) => {
        evt.stopPropagation();
        onClickGene(d.gene);
      });

    // ---- LASSO (freeform polygon) ----
    const lineClosed = d3.line<[number, number]>().curve(d3.curveLinearClosed);

    const lassoLayer = sel.append("g").attr("class", "lasso-layer");

    const lassoPath = lassoLayer
      .append("path")
      .attr("fill", "rgba(148,163,184,0.12)")
      .attr("stroke", "rgba(148,163,184,0.9)")
      .attr("stroke-width", 1.2)
      .attr("display", "none");

    let isLasso = false;
    let poly: [number, number][] = [];

    // Capture events ONLY over the plot area, and keep it ON TOP
    const hit = sel
      .append("rect")
      .attr("x", M.l)
      .attr("y", M.t)
      .attr("width", W - M.l - M.r)
      .attr("height", H - M.t - M.b)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .style("cursor", "crosshair");

    // ---- HTML tooltip driven by hit-rect (works with lasso) ----
    const wrap = wrapRef.current;
    let tip: HTMLDivElement | null = null;

    if (wrap) {
      const old = wrap.querySelector(".expracc-tooltip");
      if (old) old.remove();

      tip = document.createElement("div");
      tip.className =
        "expracc-tooltip pointer-events-none absolute z-50 rounded-md border border-gray-700 bg-gray-900/90 px-2 py-1 text-xs text-slate-100 shadow";
      tip.style.display = "none";
      wrap.style.position = "relative";
      wrap.appendChild(tip);
    }

    const findNearest = (mx: number, my: number) => {
      let best: any = null;
      let bestD2 = Infinity;
      for (const p of points) {
        const cx = x(p.expr);
        const cy = y(p.acc);
        const dx = cx - mx;
        const dy = cy - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = p;
        }
      }
      // threshold (pixels)
      return bestD2 <= 12 * 12 ? best : null;
    };

    // ensure hit rect is above axes/circles
    hit.raise();
    lassoLayer.raise();

    const svgNode = svgRef.current!;

    hit
      .on("mousedown", (evt: any) => {
        if (evt.button !== 0) return;
        evt.preventDefault();

        // hide tooltip when lasso starts
        if (tip) tip.style.display = "none";

        isLasso = true;
        poly = [];

        const [mx, my] = d3.pointer(evt, svgNode);
        poly.push([mx, my]);

        lassoPath.attr("display", null).attr("d", lineClosed(poly) ?? "");
      })
      .on("mousemove", (evt: any) => {
        const [mx, my] = d3.pointer(evt, svgNode);

        // during lasso: draw polygon
        if (isLasso) {
          poly.push([mx, my]);
          lassoPath.attr("d", lineClosed(poly) ?? "");
          return;
        }

        // not lassoing: show tooltip
        if (!tip) return;
        const p = findNearest(mx, my);
        if (!p) {
          tip.style.display = "none";
          return;
        }

        const e = Number.isFinite(p.expr) ? p.expr.toFixed(3) : "NA";
        const a = Number.isFinite(p.acc) ? p.acc.toFixed(3) : "NA";
        tip.textContent = `${p.gene} | ${p.agreement} | ExprΔ ${e} | AccΔ ${a}`;
        tip.style.left = `${evt.offsetX + 12}px`;
        tip.style.top = `${evt.offsetY + 12}px`;
        tip.style.display = "block";
      })
      .on("mouseleave", () => {
        if (tip) tip.style.display = "none";
      });

    // Bind mouseup on window so it still ends selection even if mouse leaves the rect
    const onWinUp = (evt: MouseEvent) => {
      if (!isLasso) return;
      isLasso = false;

      if (poly.length < 3) {
        lassoPath.attr("display", "none");
        return;
      }

      const genesIn = points
        .filter((p) => d3.polygonContains(poly, [x(p.expr), y(p.acc)]))
        .map((p) => p.gene);

      const mode: "replace" | "add" = (evt as any).shiftKey ? "add" : "replace";
      onLasso(genesIn, mode);

      lassoPath.attr("display", "none");

      if (tip) tip.style.display = "none";
    };

    window.addEventListener("mouseup", onWinUp);

    // IMPORTANT: cleanup listener (add this in your effect cleanup)
    return () => {
      window.removeEventListener("mouseup", onWinUp);
    };
  }, [points, selectedGenes, size.w, size.h, onClickGene, onLasso]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};
