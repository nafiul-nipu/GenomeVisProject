import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../redux-store/hooks";
import type {
  Contour2DType,
  BackgroundMask,
  ProjectionPoint,
  DensityMatrix,
} from "../../types/data_types_interfaces";
import { ThreePlaneView } from "./ThreePlaneView";

const timeCondRE = /_(\d+)hrs_(untr|vacv)$/;
const orderPlanes: ("XY" | "YZ" | "XZ")[] = ["XY", "YZ", "XZ"];

// function levelsFrom(contours?: Contour2DType[]) {
//   if (!contours?.length) return [100, 99, 98, 97, 96, 95];
//   const s = new Set<number>(contours.map((c) => c.level));
//   return Array.from(s).sort((a, b) => b - a);
// }
function averageMatrices(
  mats: (DensityMatrix | undefined)[]
): DensityMatrix | undefined {
  const arr = mats.filter(Boolean) as DensityMatrix[];
  if (!arr.length) return undefined;
  const H = arr[0].length,
    W = H ? arr[0][0].length : 0;
  if (!H || !W) return undefined;
  const out: DensityMatrix = Array.from({ length: H }, () => Array(W).fill(0));
  for (const m of arr) {
    if (m.length !== H || m[0].length !== W) return undefined;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) out[y][x] += m[y][x];
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) out[y][x] /= arr.length;
  return out;
}

export const TwoDContainer: React.FC = () => {
  const { condTab, twoDVariant, twoDBgMode, twoDLevel } = useAppSelector(
    (s) => s.ui
  );
  const data = useAppSelector((s) => s.data.data);

  const contoursRec = data?.contour_data;
  const densityRec = data?.density_data;
  const projections = data?.projectionData;
  const bgMasks = data?.backgroundMaskData as BackgroundMask | undefined;

  // collect all labels we have anywhere
  const labels = useMemo(() => {
    const set = new Set<string>();
    if (contoursRec) Object.keys(contoursRec).forEach((k) => set.add(k));
    if (densityRec) Object.keys(densityRec).forEach((k) => set.add(k));
    if (projections)
      Object.values(projections).forEach((pm) =>
        Object.keys(pm).forEach((k) => set.add(k))
      );
    return Array.from(set).sort();
  }, [contoursRec, densityRec, projections]);

  // map by time + condition
  const byTime: Record<
    "untr" | "vacv",
    Partial<Record<"12" | "18" | "24", string>>
  > = useMemo(() => {
    const idx: any = { untr: {}, vacv: {} };
    for (const k of labels) {
      const m = k.match(timeCondRE);
      if (!m) continue;
      const t = m[1] as "12" | "18" | "24";
      const c = m[2] as "untr" | "vacv";
      idx[c][t] = k;
    }
    return idx;
  }, [labels]);

  // level options (for safety; used to clamp redux level if needed)
  // const allContourLevels = useMemo(() => {
  //   const all: Contour2DType[] = [];
  //   for (const k of Object.keys(contoursRec ?? {})) {
  //     all.push(...(contoursRec![k].contours ?? []));
  //   }
  //   return levelsFrom(all);
  // }, [contoursRec]);

  // choose which condition set to draw
  const showBoth = condTab === "diff";
  const times: ("12" | "18" | "24")[] = ["12", "18", "24"];
  const labelsToUse: string[] = useMemo(() => {
    const out: string[] = [];
    for (const t of times) {
      if (showBoth) {
        if (byTime.untr[t]) out.push(byTime.untr[t]!);
        if (byTime.vacv[t]) out.push(byTime.vacv[t]!);
      } else {
        const cond = condTab === "before" ? "untr" : "vacv";
        if (byTime[cond][t]) out.push(byTime[cond][t]!);
      }
    }
    return out;
  }, [byTime, condTab, showBoth]);

  // color scheme: 12/18/24 + tint for diff
  const colorMap = useMemo(() => {
    const base: Record<"12" | "18" | "24", string> = {
      "12": "rgb(56,189,248)", // cyan
      "18": "rgb(147,197,253)", // light blue
      "24": "rgb(34,197,94)", // green
    };
    const tint: Record<"untr" | "vacv", string> = {
      untr: "rgb(244,114,182)", // pink
      vacv: "rgb(251,191,36)", // amber
    };
    const map: Record<string, string> = {};
    for (const lbl of labelsToUse) {
      const m = lbl.match(timeCondRE);
      if (!m) continue;
      const t = m[1] as "12" | "18" | "24";
      const c = m[2] as "untr" | "vacv";
      map[lbl] = showBoth ? tint[c] : base[t];
    }
    return map;
  }, [labelsToUse, showBoth]);

  // gather layers per plane at the chosen level & variant
  const contourLayersByPlane = useMemo(() => {
    const out: Record<
      "XY" | "YZ" | "XZ",
      { label: string; color: string; contours: Contour2DType[] }[]
    > = {
      XY: [],
      YZ: [],
      XZ: [],
    };
    for (const lbl of labelsToUse) {
      const list = contoursRec?.[lbl]?.contours ?? [];
      const chosen = list.filter(
        (c) => c.variant === twoDVariant && c.level === twoDLevel
      );
      const byPlane = {
        XY: [] as Contour2DType[],
        YZ: [] as Contour2DType[],
        XZ: [] as Contour2DType[],
      };
      chosen.forEach((c) => byPlane[c.plane as "XY" | "YZ" | "XZ"].push(c));
      (["XY", "YZ", "XZ"] as const).forEach((pl) => {
        if (byPlane[pl].length)
          out[pl].push({
            label: lbl,
            color: colorMap[lbl] ?? "white",
            contours: byPlane[pl],
          });
      });
    }
    return out;
  }, [contoursRec, labelsToUse, twoDVariant, twoDLevel, colorMap]);

  // projections merged per plane
  const projectionsByPlane = useMemo(() => {
    const out = {
      XY: [] as ProjectionPoint[],
      YZ: [] as ProjectionPoint[],
      XZ: [] as ProjectionPoint[],
    };
    if (!projections) return out;
    for (const lbl of labelsToUse) {
      if (projections.XY[lbl]) out.XY = out.XY.concat(projections.XY[lbl]);
      if (projections.YZ[lbl]) out.YZ = out.YZ.concat(projections.YZ[lbl]);
      if (projections.XZ[lbl]) out.XZ = out.XZ.concat(projections.XZ[lbl]);
    }
    return out;
  }, [projections, labelsToUse]);

  // background chooser (for left triplet)
  const bgByPlane = useMemo(() => {
    if (twoDBgMode === "mask") {
      return { XY: bgMasks?.XY, YZ: bgMasks?.YZ, XZ: bgMasks?.XZ } as const;
    }
    if (twoDBgMode.startsWith("density-")) {
      const which = twoDBgMode.split("-")[1] as "12" | "18" | "24" | "combined";
      const pick = (t: "12" | "18" | "24", cond: "untr" | "vacv") => {
        const lbl = byTime[cond][t];
        return lbl ? densityRec?.[lbl] : undefined;
      };
      const baseCond: "untr" | "vacv" = condTab === "before" ? "untr" : "vacv";
      if (which === "combined") {
        const mats = (plane: "XY" | "YZ" | "XZ") =>
          averageMatrices(
            (["12", "18", "24"] as const).map(
              (t) => pick(t, condTab === "diff" ? "untr" : baseCond)?.[plane]
            )
          );
        return { XY: mats("XY"), YZ: mats("YZ"), XZ: mats("XZ") } as const;
      } else {
        const d = pick(which, condTab === "diff" ? "untr" : baseCond);
        return { XY: d?.XY, YZ: d?.YZ, XZ: d?.XZ } as const;
      }
    }
    return { XY: undefined, YZ: undefined, XZ: undefined } as const;
  }, [twoDBgMode, bgMasks, densityRec, byTime, condTab]);

  // responsive sizing for ONE ROW of 6 tiles (+ a thin divider)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [, setTile] = useState({ w: 240, h: 200 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const W = e.contentRect.width;
        const H = e.contentRect.height; // use full height
        const cols = 6;
        const gap = 12; // tailwind gap-3
        const divider = 1; // px vertical divider
        const totalGaps = gap * (cols - 1) + divider; // include divider between third & fourth
        const wEach = Math.max(140, (W - totalGaps) / cols);
        const hEach = Math.max(160, H);
        setTile({ w: Math.floor(wEach), h: Math.floor(hEach) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* visual divider at 50% that doesn't affect layout */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-700/60" />

      {/* Equal-width columns; row uses full height */}
      <div className="grid grid-cols-6 gap-3 h-full">
        {([...orderPlanes, ...orderPlanes] as const).map((pl, idx) => {
          const isPts = idx >= 3;
          return (
            <SizedCell
              key={`${isPts ? "pts" : "bg"}-${pl}`}
              render={(w, h) => (
                <ThreePlaneView
                  plane={pl}
                  width={w}
                  height={h}
                  layers={contourLayersByPlane[pl]}
                  density2d={
                    !isPts && twoDBgMode !== "mask"
                      ? (bgByPlane as any)[pl]
                      : undefined
                  }
                  mask2d={
                    !isPts && twoDBgMode === "mask"
                      ? (bgByPlane as any)[pl]
                      : undefined
                  }
                  projections={isPts ? projectionsByPlane[pl] : undefined}
                  projectionsAsBg={false}
                  badge={isPts ? "PTS" : "BG"}
                />
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

const SizedCell: React.FC<{
  render: (w: number, h: number) => React.ReactNode;
}> = ({ render }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 200, h: 180 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(140, Math.floor(e.contentRect.width));
        const h = Math.max(160, Math.floor(e.contentRect.height));
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      {render(size.w, size.h)}
    </div>
  );
};
