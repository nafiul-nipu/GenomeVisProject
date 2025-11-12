// src/components/twoD/PerLabelPlane.tsx
import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { useAppSelector } from "../../redux-store/hooks";
import type {
  ContourWrapperType,
  PerLabelBackgroundMask,
  MaskMatrix,
  Plane,
  Variant,
  PerLabelContourMaskProps,
} from "../../types/data_types_interfaces";
import "../../App.css";

function maskToURL(
  mask: number[][],
  alphaFloat = 0.18,
  color: [number, number, number] = [255, 255, 255]
) {
  const ny = mask.length,
    nx = mask[0].length;
  const c = document.createElement("canvas");
  c.width = nx;
  c.height = ny;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.createImageData(nx, ny),
    d = img.data;
  const A = Math.round(Math.max(0, Math.min(1, alphaFloat)) * 255);
  let k = 0;
  for (let y = 0; y < ny; y++) {
    const row = mask[y];
    for (let x = 0; x < nx; x++) {
      if (row[x]) {
        d[k] = color[0];
        d[k + 1] = color[1];
        d[k + 2] = color[2];
        d[k + 3] = A;
      }
      k += 4;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function ensureXY(poly: [number, number][] | null, nx: number) {
  if (!Array.isArray(poly) || poly.length < 2) return poly;
  let badX = 0,
    badSwap = 0;
  for (const p of poly) {
    const x = p[0];
    if (x < 0 || x >= nx) badX++;
  }
  for (const p of poly) {
    const x = p[1];
    if (x < 0 || x >= nx) badSwap++;
  }
  if (badX > poly.length * 0.2 && badSwap < badX)
    return poly.map((p) => [p[1], p[0]] as [number, number]);
  return poly;
}

// Same logic as the test file
function pickContourFor(
  raw: ContourWrapperType,
  plane: Plane,
  vkey: Variant,
  levelStr: string
): [number, number][] | null {
  const arr = raw?.contours;
  if (!arr || !arr.length) return null;

  const want = vkey === "pf" ? ["pf", "point_fraction"] : ["hdr"];

  // Try to find exact match
  const exact = arr.filter(
    (d) =>
      d.plane === plane &&
      want.includes(d.variant) &&
      String(d.level) === levelStr
  );
  if (exact.length) return exact[0].points;

  // Fallback: nearest level match
  const levs = arr
    .filter((d) => d.plane === plane && want.includes(d.variant))
    .map((d) => +d.level);
  if (levs.length) {
    const target = +levelStr;
    let best = levs[0];
    let bd = Math.abs(levs[0] - target);
    for (const L of levs) {
      const dd = Math.abs(L - target);
      if (dd < bd) {
        best = L;
        bd = dd;
      }
    }
    const alt = arr.find(
      (d) => d.plane === plane && want.includes(d.variant) && +d.level === best
    );
    if (alt) return alt.points;
  }

  return null;
}

// ---- D3 view code identical to the test ----
function draw(
  svg: SVGSVGElement,
  mask: MaskMatrix,
  poly: [number, number][] | null,
  maskAlpha: number
) {
  const ny = mask.length,
    nx = mask[0].length;
  const PAD = 8;

  svg.setAttribute("viewBox", `0 0 ${nx + 2 * PAD} ${ny + 2 * PAD}`);

  const sel = d3.select(svg);
  sel.selectAll("*").remove();

  const g = sel.append("g").attr("transform", `translate(${PAD},${PAD})`);

  g.append("image")
    .attr("href", maskToURL(mask, maskAlpha))
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", nx)
    .attr("height", ny);

  if (poly && poly.length) {
    const d = "M " + poly.map((p) => `${p[0]},${p[1]}`).join(" L ") + " Z";
    g.append("path")
      .attr("class", "contour-back")
      .attr("d", d)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("vector-effect", "non-scaling-stroke");
    g.append("path")
      .attr("class", "contour")
      .attr("d", d)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("vector-effect", "non-scaling-stroke");
  } else {
    g.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "#fff")
      .text("No contour");
  }
}

export const PerLabelContourMask: React.FC<PerLabelContourMaskProps> = ({
  label,
  plane,
  variant,
  level,
  maskOpacity = 0.18,
  className,
}) => {
  // Use your real slice paths
  const bgByLabel = useAppSelector(
    (s) =>
      (s.data.data?.perLabelBackgroundMaskData as PerLabelBackgroundMask)?.[
        label
      ]
  );
  const cntByLabel = useAppSelector(
    (s) =>
      (s.data.data?.contour_data as Record<string, ContourWrapperType>)?.[label]
  );

  // console.log(cntByLabel);
  // console.log(bgByLabel);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compute mask + contour using same helpers as the test
  const {
    mask,
    poly,
    nx,
    ny,
  }: {
    mask: MaskMatrix | null;
    poly: [number, number][] | null;
    nx: number;
    ny: number;
  } = useMemo(() => {
    const mask = bgByLabel?.[plane];
    if (!mask || !mask.length || !mask[0]?.length)
      return { mask: null, poly: null, nx: 0, ny: 0 };
    const ny = mask.length,
      nx = mask[0].length;
    const levelStr = String(level);
    let poly = cntByLabel
      ? pickContourFor(cntByLabel, plane, variant, levelStr)
      : null;
    poly = ensureXY(poly, nx);
    return { mask, poly, nx, ny };
  }, [bgByLabel, cntByLabel, plane, variant, level]);

  // Render with the same D3 'draw' used in the HTML
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!mask) {
      const sel = d3.select(svg);
      sel.selectAll("*").remove();
      sel
        .append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("fill", "#fff")
        .text(`No mask for ${plane}`);
      return;
    }
    draw(svg, mask, poly, maskOpacity);
  }, [mask, poly, maskOpacity, plane, nx, ny]);

  const title = `${plane} · ${label} · ${variant.toUpperCase()} · L${level}`;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      </div>
      {/* <div className="rounded-lg bg-[#0f1013] border border-gray-800 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full block"
          preserveAspectRatio="xMidYMid meet"
        />
      </div> */}
      <div className="rounded-lg bg-[#0f1013] border border-gray-800">
        <div className="w-full h-full p-3">
          <svg
            ref={svgRef}
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
          />
        </div>
      </div>
    </div>
  );
};
