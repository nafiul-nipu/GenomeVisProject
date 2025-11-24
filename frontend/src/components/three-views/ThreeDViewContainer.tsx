import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  OrbitControls,
  View,
} from "@react-three/drei";
import { useAppSelector } from "../../redux-store/hooks";
import { Lights } from "./Lights";
import {
  type DataInfoType,
  type PositionMode,
} from "../../types/data_types_interfaces";
import { DrawObject } from "./DrawObjects";
import { useLevaUIControls } from "./useLevaUIControls";
import { CornerAxes } from "./CornerAxes";

type Props = { meta_data_typed: DataInfoType };

const titlesRow = 18; // label line-height
const gapX = 8; // matches gap-2

export function ThreeDViewContainer({ meta_data_typed }: Props) {
  const { condTab, timeIdx, species, chromosome } = useAppSelector((s) => s.ui);

  // which position to use for genes
  const [positionMode] = useState<PositionMode>("aligned");

  const geneData = useAppSelector((s) => s.data.data?.gene_data) || {};
  const geneEdges = useAppSelector((s) => s.data.data?.gene_edges) || {};
  const genePaths = useAppSelector((s) => s.data.data?.gene_paths) || {};

  // Host element for events and for layout
  const hostRef = useRef<HTMLDivElement>(null);
  const [eventSource, setEventSource] = useState<HTMLElement | undefined>();
  useEffect(() => {
    if (hostRef.current) setEventSource(hostRef.current);
  }, []);

  // to update sizes on resize
  const tracksWrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!tracksWrapRef.current) return;
    const el = tracksWrapRef.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setWrapSize({ w: rect.width, h: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const meta = meta_data_typed?.[species];
  const timepoints: string[] = meta?.timepoints ?? [];
  const beforecode = (meta?.before_name ?? "before").toLowerCase();
  const aftercode = (meta?.after_name ?? "after").toLowerCase();

  const makeKey = (tp: string, code: string) => `${chromosome}_${tp}_${code}`;
  // View keys & titles
  const viewKeys = useMemo(() => {
    if (condTab === "diff") return ["before", "after"] as const;
    return timepoints.map((tp) => `${condTab}:${tp}` as const);
  }, [condTab, timepoints]);

  const titles = useMemo(() => {
    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? "";
      return [
        `${chromosome}_${beforecode}_${tp}`,
        `${chromosome}_${aftercode}_${tp}`,
      ];
    }

    const condName = condTab === "before" ? beforecode : aftercode;
    return timepoints.map((tp) => `${chromosome}_${condName}_${tp}`);
  }, [chromosome, condTab, timeIdx, species, timepoints]);

  const viewItems = useMemo(() => {
    const makeViews = (tp: string, code: string) => ({
      geneData: geneData[makeKey(tp, code)] ?? [],
      geneEdges: geneEdges[makeKey(tp, code)] ?? [],
      genePaths: genePaths[makeKey(tp, code)] ?? [],
    });

    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? "";
      return [makeViews(tp, beforecode), makeViews(tp, aftercode)];
    }

    const code = condTab === "before" ? beforecode : aftercode;
    return timepoints.map((tp) => makeViews(tp, code));
  }, [
    geneData,
    geneEdges,
    genePaths,
    condTab,
    timeIdx,
    timepoints,
    beforecode,
    aftercode,
    chromosome,
  ]);

  const viewLabels = useMemo(() => {
    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? "";
      return [
        makeKey(tp, beforecode), // chr1_12hrs_untr
        makeKey(tp, aftercode), // chr1_12hrs_vacv
      ];
    }
    const code = condTab === "before" ? beforecode : aftercode;
    return timepoints.map((tp) => makeKey(tp, code)); // chr1_12hrs_untr, 18hrs...
  }, [condTab, timeIdx, timepoints, beforecode, aftercode, chromosome]);

  useEffect(() => {
    invalidate();
  }, [viewItems, positionMode]);

  // HTMLElement refs for <View track={…}>
  // NOTE: No manual assignment, no callback ref — just normal refs used directly.
  const viewRefs = useMemo(
    () => viewKeys.map(() => React.createRef<HTMLDivElement>()),
    [viewKeys]
  );

  // Sizes
  const columns = Math.max(1, viewKeys.length);

  const viewHeight = Math.max(120, Math.floor(wrapSize.h - titlesRow));
  const viewWidth = Math.max(
    220,
    Math.floor((wrapSize.w - gapX * (columns - 1)) / columns) - 2
  );

  // console.log(viewItems);

  // leva controls
  const {
    // Lights
    ambientVisible,
    ambientIntensity,
    dirFrontVisible,
    dirFrontPos,
    dirFrontIntensity,
    dirFrontShadow,
    // Genes
    geneColor,
    geneEmissive,
    geneSpecular,
    geneShininess,
    geneRadius,
    // Tubes
    tubeColor,
    tubeEmissive,
    tubeSpecular,
    tubeShininess,
    tubeRadius,
  } = useLevaUIControls();

  return (
    <div ref={hostRef} className="relative w-full h-full overflow-hidden">
      {/* Titles + target divs */}
      <div
        ref={tracksWrapRef}
        className="absolute left-3 top-3 right-3 bottom-3 z-10 flex gap-2 pointer-events-none overflow-hidden"
      >
        {viewRefs.map((ref, i) => (
          <div key={i} className="flex flex-col pointer-events-auto">
            <div className="text-xs text-gray-300 mb-1">{titles[i]}</div>
            <div
              ref={ref}
              style={{ width: viewWidth, height: viewHeight }}
              className="inline-block rounded-md border border-gray-800 bg-gray-900/40 box-border"
            />
          </div>
        ))}
      </div>

      {/* The canvas that powers all views */}
      <Canvas
        eventSource={eventSource}
        className="absolute inset-0 z-0"
        frameloop="demand"
        performance={{ min: 0.4 }}
        camera={{ position: [10, 5, 75], near: 0.1 }}
      >
        {viewRefs.map((ref, i) => (
          <View
            key={i}
            track={ref as unknown as React.RefObject<HTMLElement>}
            index={i}
          >
            <color attach="background" args={["#0b0f16"]} />
            <Lights
              ambientCtl={{
                visible: ambientVisible,
                intensity: ambientIntensity,
              }}
              directionalCtl={{
                visible: dirFrontVisible,
                position: dirFrontPos,
                intensity: dirFrontIntensity,
                castShadow: dirFrontShadow,
              }}
              directionalCtl2={{
                visible: false,
                position: { x: 0, y: 0, z: 0 },
                intensity: 0,
                castShadow: false,
              }}
              directionalLeftCtl={{
                visible: false,
                position: { x: 0, y: 0, z: 0 },
                intensity: 0,
                castShadow: false,
              }}
              directionalRightCtl={{
                visible: false,
                position: { x: 0, y: 0, z: 0 },
                intensity: 0,
                castShadow: false,
              }}
            />
            <DrawObject
              label={viewLabels[i]}
              geneColorPickerIdx={i}
              geneData={viewItems[i].geneData ?? []}
              geneEdges={viewItems[i].geneEdges ?? []}
              genePaths={viewItems[i].genePaths ?? []}
              positionMode={positionMode}
              nodeCtl={{
                geneColor: geneColor,
                geneEmissive: geneEmissive,
                geneSpecular: geneSpecular,
                geneShininess: geneShininess,
                geneRadius: geneRadius,
              }}
              tubeCtl={{
                tubeColor: tubeColor,
                tubeEmissive: tubeEmissive,
                tubeSpecular: tubeSpecular,
                tubeShininess: tubeShininess,
                tubeRadius: tubeRadius,
              }}
            />
            {/* <axesHelper args={[5]} /> */}
            <CornerAxes size={0.5} distance={20} offsetX={21} offsetY={11} />

            <OrbitControls
              makeDefault
              enableDamping={false}
              regress
              enablePan={true}
              enableZoom={true}
            />
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
          </View>
        ))}
      </Canvas>
    </div>
  );
}

export default ThreeDViewContainer;
