// components/three-d/ThreeDViewContainer.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  OrbitControls,
  View,
  Center,
} from "@react-three/drei";
import { useAppSelector } from "../../redux-store/hooks";
import { Lights } from "./Lights";
import LightsPanel from "./LightsPanel";
import {
  defaultLightSettings,
  type DataInfoType,
  type LightSettings,
} from "../../types/data_types_interfaces";

import * as THREE from "three";

// Simple visible thing: rotating cube + axes + ground
function SpinningCube() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.5;
      ref.current.rotation.y += dt * 0.7;
    }
  });
  return (
    <Center>
      <mesh ref={ref}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial />
      </mesh>
      <axesHelper args={[5]} />
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial />
      </mesh>
    </Center>
  );
}

type Props = { meta_data_typed: DataInfoType };

export function ThreeDViewContainer({ meta_data_typed }: Props) {
  const { condTab, timeIdx, species } = useAppSelector((s) => s.ui);
  const meta = meta_data_typed;

  // Host element for events and for layout
  const hostRef = useRef<HTMLDivElement>(null);
  const [eventSource, setEventSource] = useState<HTMLElement | undefined>();
  useEffect(() => {
    if (hostRef.current) setEventSource(hostRef.current);
  }, []);

  // Timepoints from metadata
  const timepoints: string[] = useMemo(
    () => meta?.[species]?.timepoints ?? [],
    [meta, species]
  );

  // Lights state
  const [lightSettings, setLightSettings] =
    useState<LightSettings>(defaultLightSettings);

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
  const viewHeight = Math.round((60 * window.innerHeight) / 100);
  const viewWidth = Math.max(
    220,
    Math.floor(window.innerWidth / Math.max(1, viewKeys.length)) - 16
  );

  return (
    <div ref={hostRef} className="relative w-full h-full">
      {/* Floating settings panel */}
      <div className="absolute right-3 top-3 z-20 pointer-events-auto">
        <LightsPanel settings={lightSettings} onChange={setLightSettings} />
      </div>

      {/* Titles + target divs */}
      <div className="absolute left-3 top-3 z-10 flex gap-2 pointer-events-none">
        {viewRefs.map((ref, i) => (
          <div key={i} className="flex flex-col pointer-events-auto">
            <div className="text-xs text-gray-300 mb-1">{titles[i]}</div>
            <div
              ref={ref}
              style={{ width: viewWidth, height: viewHeight }}
              className="inline-block rounded-md border border-gray-800 bg-gray-900/40"
            />
          </div>
        ))}
      </div>

      {/* The canvas that powers all views */}
      <Canvas
        eventSource={eventSource}
        className="absolute inset-0 z-0"
        frameloop="always" // ensure the cube spins; change to "demand" later
        performance={{ min: 0.4 }}
        camera={{ position: [8, 6, 18], near: 0.1 }}
      >
        {viewRefs.map((ref, i) => (
          <View
            key={i}
            track={ref as unknown as React.RefObject<HTMLElement>}
            index={i}
          >
            <color attach="background" args={["#0b0f16"]} />
            <Lights settings={lightSettings} />
            <SpinningCube />
            <OrbitControls
              makeDefault
              enableDamping={false}
              enablePan
              enableZoom
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
