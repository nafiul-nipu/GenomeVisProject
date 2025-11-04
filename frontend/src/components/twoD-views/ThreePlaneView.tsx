import React, { useEffect, useMemo, useRef } from "react";
import type {
  Contour2DType,
  ProjectionPoint,
  DensityMatrix,
  MaskMatrix,
} from "../../types/data_types_interfaces";

type Layer = { label: string; color: string; contours: Contour2DType[] };

function computeExtent(layers: Layer[], proj?: ProjectionPoint[]) {
  let xs: number[] = [],
    ys: number[] = [];
  for (const L of layers)
    for (const c of L.contours)
      for (const [x, y] of c.points) {
        xs.push(x);
        ys.push(y);
      }
  (proj ?? []).forEach(([x, y]) => {
    xs.push(x);
    ys.push(y);
  });
  if (!xs.length) xs = [0, 1];
  if (!ys.length) ys = [0, 1];
  const xmin = Math.min(...xs),
    xmax = Math.max(...xs);
  const ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  const dx = xmax - xmin || 1,
    dy = ymax - ymin || 1;
  return { xmin, xmax: xmin + dx, ymin, ymax: ymin + dy };
}

function drawScalarCanvas(
  canvas: HTMLCanvasElement,
  grid: DensityMatrix | MaskMatrix
) {
  const h = grid.length,
    w = h ? grid[0].length : 0;
  if (!w || !h) return;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const im = ctx.createImageData(w, h);
  let min = Infinity,
    max = -Infinity;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = grid[y][x] ?? 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  const rng = max - min || 1;
  let k = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = grid[y][x] ?? 0,
        t = (v - min) / rng,
        g = Math.round(t * 255);
      im.data[k++] = g;
      im.data[k++] = g;
      im.data[k++] = g;
      im.data[k++] = 160;
    }
  ctx.putImageData(im, 0, 0);
}

export const ThreePlaneView: React.FC<{
  plane: "XY" | "XZ" | "YZ";
  width: number;
  height: number;
  layers: Layer[];
  projections?: ProjectionPoint[];
  projectionsAsBg?: boolean;
  density2d?: DensityMatrix;
  mask2d?: MaskMatrix;
  badge?: "BG" | "PTS"; // << NEW: small corner tag
}> = ({
  plane,
  width,
  height,
  layers,
  projections,
  projectionsAsBg,
  density2d,
  mask2d,
  badge,
}) => {
  const pad = 10;
  const W = Math.max(140, Math.floor(width));
  const H = Math.max(160, Math.floor(height));
  const wPlot = W - pad * 2,
    hPlot = H - pad * 2;

  const { xmin, xmax, ymin, ymax } = useMemo(
    () => computeExtent(layers, projections),
    [layers, projections]
  );
  const sx = (x: number) => pad + ((x - xmin) / (xmax - xmin)) * wPlot;
  const sy = (y: number) => pad + (1 - (y - ymin) / (ymax - ymin)) * hPlot;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);

    if (density2d || mask2d) {
      drawScalarCanvas(c, (density2d ?? mask2d)!);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      return;
    }
    // if (density2d || mask2d) {
    //   // drawScalarCanvas sets c.width & c.height from grid size, but set again to match the cell:
    //   c.width = W;
    //   c.height = H;
    //   drawScalarCanvas(c, (density2d ?? mask2d)!);
    //   return;
    // }

    if (projectionsAsBg && projections?.length) {
      c.width = W;
      c.height = H;
      ctx.globalAlpha = 0.25;
      for (const [x, y] of projections) {
        const X = sx(x),
          Y = sy(y);
        ctx.fillRect(Math.round(X), Math.round(Y), 1, 1);
      }
    }
  }, [density2d, mask2d, projectionsAsBg, projections, W, H, sx, sy]);

  return (
    <div
      className="relative rounded-lg bg-gray-900/50 border border-gray-800 overflow-hidden"
      style={{ width: W, height: H }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        aria-label={`${plane} background`}
      />

      {/* tiny corner badge */}
      {badge && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] rounded bg-gray-800/80 border border-gray-700 text-gray-200">
          {badge}
        </div>
      )}

      <svg
        className="absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <rect
          x={0.5}
          y={0.5}
          width={W - 1}
          height={H - 1}
          fill="none"
          stroke="rgba(148,163,184,0.25)"
        />
        <text x={8} y={16} fontSize={11} fill="rgba(203,213,225,0.9)">
          {plane}
        </text>

        {/* projections overlay (if not used as background) */}
        {!projectionsAsBg &&
          projections?.map(([x, y], i) => (
            <circle
              key={i}
              cx={sx(x)}
              cy={sy(y)}
              r={1.2}
              fill="rgb(244,114,182)"
              opacity={0.8}
            />
          ))}

        {/* contour layers */}
        {layers.map((L, li) =>
          L.contours.map((c, i) => {
            if (!c.points?.length) return null;
            const d = c.points
              .map(([x, y], j) => `${j ? "L" : "M"}${sx(x)},${sy(y)}`)
              .join(" ");
            return (
              <path
                key={`${li}-${i}`}
                d={`${d} Z`}
                fill="none"
                stroke={L.color}
                strokeWidth={1.8}
                opacity={0.95}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
