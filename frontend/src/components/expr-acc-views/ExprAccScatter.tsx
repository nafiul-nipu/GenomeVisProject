/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import type { ExprAccScatterProps } from "../../types/data_types_interfaces";
import { AGREEMENT_COLORS } from "../../utilFunctions/colorForViews";

export const ExprAccScatter: React.FC<ExprAccScatterProps> = ({
  points,
  onHover,
  onClickGene,
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

    const circles = g
      .selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.expr))
      .attr("cy", (d) => y(d.acc))
      .attr("r", 2.6)
      .attr("fill", (d) => AGREEMENT_COLORS[d.agreement] ?? "#94a3b8")
      .attr("stroke", "#020617")
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.95)
      .on("mouseenter", (_, d: any) => onHover(d.idx))
      .on("mouseleave", () => onHover(null))
      .on("click", (_, d: any) => onClickGene(d.gene));

    circles.append("title").text((d) => {
      const e = Number.isFinite(d.expr) ? d.expr.toFixed(3) : "NA";
      const a = Number.isFinite(d.acc) ? d.acc.toFixed(3) : "NA";
      return `${d.gene}\nclass: ${d.agreement}\nExpr Δ: ${e}\nAcc Δ: ${a}`;
    });
  }, [points, size.w, size.h, onHover, onClickGene]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};
