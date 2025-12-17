import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import type {
  ContourWrapperType,
  PerLabelBackgroundMask,
  MaskMatrix,
  Plane,
  Variant,
  PerLabelContourMaskProps,
  MembershipState,
  Point2D,
  GeneRowDataType,
} from "../../types/data_types_interfaces";
import "../../App.css";
import {
  AGREEMENT_COLORS,
  colorPaletteSelector,
} from "../../utilFunctions/colorForViews";
import {
  clearHighlightedGenes,
  setHighlightedGenesForLabel,
} from "../../redux-store/uiSlice";

type ColoredPoint = { x: number; y: number; color: string };

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

function polygonArea(poly: [number, number][]): number {
  if (!poly || poly.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

// Same logic as the test file, but now returns ALL blobs for that level
function pickContoursFor(
  raw: ContourWrapperType,
  plane: Plane,
  vkey: Variant,
  levelStr: string
): [number, number][][] {
  const arr = raw?.contours;
  if (!arr || !arr.length) return [];

  const want = vkey === "pf" ? ["pf", "point_fraction"] : ["hdr"];

  // --- exact matches for (plane, variant, level) ---
  const exact = arr.filter(
    (d) =>
      d.plane === plane &&
      want.includes(d.variant) &&
      String(d.level) === levelStr
  );
  if (exact.length) {
    return exact.map((d) => d.points as [number, number][]);
  }

  // --- fallback: nearest level for that plane+variant ---
  const levs = arr
    .filter((d) => d.plane === plane && want.includes(d.variant))
    .map((d) => +d.level);
  if (!levs.length) return [];

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

  const alts = arr.filter(
    (d) => d.plane === plane && want.includes(d.variant) && +d.level === best
  );
  return alts.map((d) => d.points as [number, number][]);
}

function draw(
  svg: SVGSVGElement,
  mask: MaskMatrix,
  polys: [number, number][][],
  maskAlpha: number,
  strokeColor: string,
  hoverPoint?: Point2D | null,
  selectedPoints?: Point2D[] | null,
  temporalPoints?: { x: number; y: number; color: string }[] | null
) {
  const ny = mask.length,
    nx = mask[0].length;
  const PAD = 8;
  svg.setAttribute("viewBox", `0 0 ${nx + 2 * PAD} ${ny + 2 * PAD}`);

  const sel = d3.select(svg);
  sel.selectAll("*").remove();
  const g = sel.append("g").attr("transform", `translate(${PAD},${PAD})`);

  // background
  g.append("image")
    .attr("href", maskToURL(mask, maskAlpha))
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", nx)
    .attr("height", ny);

  if (polys && polys.length) {
    for (const poly of polys) {
      if (!poly.length) continue;
      const d = "M " + poly.map((p) => `${p[0]},${p[1]}`).join(" L ") + " Z";

      // soft glow/back
      g.append("path")
        .attr("d", d)
        .attr("fill", "none")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 5)
        .attr("opacity", 0.25)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("vector-effect", "non-scaling-stroke");

      // main stroke
      g.append("path")
        .attr("d", d)
        .attr("fill", "none")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2.2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("vector-effect", "non-scaling-stroke");
    }
  } else {
    g.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "#fff")
      .text("No contour for this selection");
  }

  // --- hovered gene marker (if provided) ---
  if (hoverPoint) {
    const [hx, hy] = hoverPoint;

    // Outer halo
    g.append("circle")
      .attr("cx", hx)
      .attr("cy", hy)
      .attr("r", 5)
      .attr("fill", "none")
      .attr("stroke", "#0ea5e9") // cyan-ish halo
      .attr("stroke-width", 3)
      .attr("opacity", 0.6)
      .attr("vector-effect", "non-scaling-stroke");

    // Solid center dot
    g.append("circle")
      .attr("cx", hx)
      .attr("cy", hy)
      .attr("r", 2.5)
      .attr("fill", "#f97316") // orange core
      .attr("stroke", "#020617")
      .attr("stroke-width", 1.2)
      .attr("vector-effect", "non-scaling-stroke");
  }

  // --- selected genes markers ---
  if (selectedPoints && selectedPoints.length) {
    for (const [sx, sy] of selectedPoints) {
      // halo
      g.append("circle")
        .attr("cx", sx)
        .attr("cy", sy)
        .attr("r", 4.5)
        .attr("fill", "none")
        .attr("stroke", "#a855f7") // purple halo
        .attr("stroke-width", 2.5)
        .attr("opacity", 0.7)
        .attr("vector-effect", "non-scaling-stroke");

      // solid dot
      g.append("circle")
        .attr("cx", sx)
        .attr("cy", sy)
        .attr("r", 2.2)
        .attr("fill", "#a855f7")
        .attr("stroke", "#020617")
        .attr("stroke-width", 1.0)
        .attr("vector-effect", "non-scaling-stroke");
    }
  }

  // --- temporal class filter markers ---
  if (temporalPoints && temporalPoints.length) {
    for (const p of temporalPoints) {
      g.append("circle")
        .attr("cx", p.x)
        .attr("cy", p.y)
        .attr("r", 2.6)
        .attr("fill", p.color)
        .attr("stroke", "#020617")
        .attr("stroke-width", 0.9)
        .attr("opacity", 0.95)
        .attr("vector-effect", "non-scaling-stroke");
    }
  }
}

export const PerLabelContourMask: React.FC<PerLabelContourMaskProps> = ({
  idx,
  label,
  plane,
  variant,
  level,
  maskOpacity = 0.18,
  className,
}) => {
  const dispatch = useAppDispatch();
  const { twoDCleanBlobs, twoDBlobMinAreaPct } = useAppSelector((s) => s.ui);
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
  const membership = useAppSelector(
    (s) => s.data.data?.membership as MembershipState | undefined
  );

  const hovered = useAppSelector((s) => s.ui.hoveredGene);

  const selectedGenes = useAppSelector((s) => s.ui.selectedGenes);

  const geneDataForLabel = useAppSelector(
    (s) =>
      (
        s.data.data?.gene_data as Record<string, GeneRowDataType[]> | undefined
      )?.[label]
  );

  const temporalFilter = useAppSelector((s) => s.ui.temporalClassFilter);
  const temporalByGeneName =
    useAppSelector((s) => s.data.data?.temporalTrendData.byGeneName) ?? {};

  //helper to get indices for this plane
  const highlightIdxs = useMemo(() => {
    const labelEntry = membership?.[label];
    if (!labelEntry) return [] as number[];

    const planeEntry = labelEntry.planes?.[plane];
    if (!planeEntry) return [];

    const vkey = variant === "hdr" ? "hdr" : "point_fraction"; // map pf -> point_fraction

    const byLevel = planeEntry[vkey] as Record<string, number[]> | undefined;

    if (!byLevel) return [];
    return byLevel[String(level)] ?? [];
  }, [membership, plane, label, variant, level]);

  const containsHovered = useMemo(() => {
    if (!hovered || hovered.label !== label) return false;
    if (!highlightIdxs.length) return false;
    return highlightIdxs.includes(hovered.idx);
  }, [hovered, label, highlightIdxs]);

  const hoverPoint: Point2D | null = useMemo(() => {
    if (!hovered || hovered.label !== label) return null;

    const labEntry = membership?.[label];
    if (!labEntry) return null;
    const planeEntry = labEntry.planes?.[plane];
    if (!planeEntry) return null;

    const pixels = planeEntry.pixels;
    // safety: check bounds
    if (!pixels || hovered.idx < 0 || hovered.idx >= pixels.length) return null;

    const pt = pixels[hovered.idx]; // [x_idx, y_idx] in mask pixel coords
    return pt as Point2D;
  }, [hovered, label, plane, membership]);

  const selectedPoints: Point2D[] = useMemo(() => {
    if (!selectedGenes.length) return [];
    if (!geneDataForLabel || !geneDataForLabel.length) return [];

    const labEntry = membership?.[label];
    const planeEntry = labEntry?.planes?.[plane];
    const pixels = planeEntry?.pixels;

    if (!pixels || !pixels.length) return [];

    const pts: Point2D[] = [];

    // geneDataForLabel index must match pixels index (same ordering)
    for (let i = 0; i < geneDataForLabel.length; i++) {
      const g = geneDataForLabel[i];
      if (selectedGenes.includes(g.gene_name)) {
        const p = pixels[i];
        if (p) pts.push(p as Point2D);
      }
    }

    return pts;
  }, [selectedGenes, geneDataForLabel, membership, label, plane]);

  const temporalPoints: ColoredPoint[] = useMemo(() => {
    if (!temporalFilter.length) return [];
    if (!geneDataForLabel || !geneDataForLabel.length) return [];

    const labEntry = membership?.[label];
    const planeEntry = labEntry?.planes?.[plane];
    const pixels = planeEntry?.pixels;
    if (!pixels || !pixels.length) return [];

    const keep = new Set(temporalFilter);
    const pts: ColoredPoint[] = [];

    for (let i = 0; i < geneDataForLabel.length; i++) {
      const g = geneDataForLabel[i];
      const cls =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (temporalByGeneName[g.gene_name] as any)?.agreement_class ??
        "not_expressed";

      if (keep.has(cls)) {
        const p = pixels[i];
        if (p) {
          pts.push({
            x: p[0],
            y: p[1],
            color: AGREEMENT_COLORS[cls] ?? "#94a3b8",
          });
        }
      }
    }

    return pts;
  }, [
    temporalFilter,
    geneDataForLabel,
    membership,
    label,
    plane,
    temporalByGeneName,
  ]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compute mask + contours using same helpers as the test
  const {
    mask,
    polys,
    nx,
    ny,
  }: {
    mask: MaskMatrix | null;
    polys: [number, number][][];
    nx: number;
    ny: number;
  } = useMemo(() => {
    const mask = bgByLabel?.[plane];
    if (!mask || !mask.length || !mask[0]?.length)
      return { mask: null, polys: [], nx: 0, ny: 0 };

    const ny = mask.length,
      nx = mask[0].length;
    const levelStr = String(level);

    let polys: [number, number][][] = [];
    if (cntByLabel) {
      polys = pickContoursFor(cntByLabel, plane, variant, levelStr).map(
        (poly) => ensureXY(poly, nx) as [number, number][]
      );
    }

    return { mask, polys, nx, ny };
  }, [bgByLabel, cntByLabel, plane, variant, level]);

  const cleanedPolys = useMemo(() => {
    if (!polys.length) return polys;
    if (!twoDCleanBlobs) return polys;

    const MIN_LEN = 10; // vertex count filter
    const frac = (twoDBlobMinAreaPct ?? 0) / 100;
    if (frac <= 0) {
      // only length filter
      return polys.filter((poly) => poly.length >= MIN_LEN);
    }

    const areas = polys.map((poly) => polygonArea(poly));
    const maxArea = Math.max(...areas, 0);
    if (!maxArea) return polys;

    return polys.filter(
      (poly, i) => poly.length >= MIN_LEN && areas[i] >= frac * maxArea
    );
  }, [polys, twoDCleanBlobs, twoDBlobMinAreaPct]);

  const strokeColor = colorPaletteSelector(idx ?? 0);

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

    draw(
      svg,
      mask,
      cleanedPolys,
      maskOpacity,
      strokeColor,
      hoverPoint,
      selectedPoints,
      temporalPoints
    );
  }, [
    mask,
    cleanedPolys,
    maskOpacity,
    plane,
    nx,
    ny,
    strokeColor,
    hoverPoint,
    selectedPoints,
    temporalPoints,
  ]);

  const title = `${plane} · ${label} · ${variant.toUpperCase()} · L${level}`;

  const handleMouseEnter = () => {
    if (!highlightIdxs.length) return;
    dispatch(
      setHighlightedGenesForLabel({
        label,
        indices: highlightIdxs,
      })
    );
  };

  const handleMouseLeave = () => {
    dispatch(clearHighlightedGenes());
  };

  const outerClass = `${className ?? ""} ${
    containsHovered
      ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-gray-900"
      : ""
  }`;

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
      <div className={outerClass}>
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
    </div>
  );
};
