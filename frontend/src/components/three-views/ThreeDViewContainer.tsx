// components/three-d/ThreeDViewContainer.tsx
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  OrbitControls,
  View,
} from "@react-three/drei";
import { useAppSelector } from "../../redux-store/hooks";
import { Lights } from "./Lights";
import { type DataInfoType } from "../../types/data_types_interfaces";
import { GeneSphereView } from "./GeneSphereView";

type Props = { meta_data_typed: DataInfoType };

export function ThreeDViewContainer({ meta_data_typed }: Props) {
  const { condTab, timeIdx, species, lightSettings } = useAppSelector(
    (s) => s.ui
  );
  const meta = meta_data_typed;

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

  // Timepoints from metadata
  const timepoints: string[] = useMemo(
    () => meta?.[species]?.timepoints ?? [],
    [meta, species]
  );

  // View keys & titles
  const viewKeys = useMemo(() => {
    if (condTab === "diff") return ["before", "after"] as const;
    return timepoints.map((tp) => `${condTab}:${tp}` as const);
  }, [condTab, timepoints]);

  const titles = useMemo(() => {
    if (condTab === "diff") {
      const tp = timepoints[timeIdx] ?? "";
      return [`before • ${tp}`, `after • ${tp}`];
    }
    return timepoints.map((tp) => `${condTab} • ${tp}`);
  }, [condTab, timeIdx, timepoints]);

  // HTMLElement refs for <View track={…}>
  // NOTE: No manual assignment, no callback ref — just normal refs used directly.
  const viewRefs = useMemo(
    () => viewKeys.map(() => React.createRef<HTMLDivElement>()),
    [viewKeys]
  );

  // Sizes
  const titlesRow = 18; // label line-height
  const gapX = 8; // matches gap-2
  const columns = Math.max(1, viewKeys.length);

  const viewHeight = Math.max(120, Math.floor(wrapSize.h - titlesRow));
  const viewWidth = Math.max(
    220,
    Math.floor((wrapSize.w - gapX * (columns - 1)) / columns) - 2
  );

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
        frameloop="demand" // ensure the cube spins; change to "demand" later
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
            <Lights settings={lightSettings} />
            <GeneSphereView meta_data={meta_data_typed} />
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
