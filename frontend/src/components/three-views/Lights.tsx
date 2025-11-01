type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type LightCtl = {
  visible?: boolean;
  intensity?: number;
  position?: Vec3;
  castShadow?: boolean;
};

type LightsProps = {
  ambientCtl: LightCtl;
  directionalCtl: LightCtl;
  directionalCtl2: LightCtl;
  directionalLeftCtl: LightCtl;
  directionalRightCtl: LightCtl;
};

export const Lights = ({
  ambientCtl,
  directionalCtl,
  directionalCtl2,
  directionalLeftCtl,
  directionalRightCtl,
}: LightsProps) => {
  return (
    <>
      <ambientLight
        visible={ambientCtl.visible}
        intensity={ambientCtl.intensity}
      />
      <directionalLight
        visible={directionalCtl.visible}
        position={[
          directionalCtl?.position?.x ?? 0,
          directionalCtl?.position?.y ?? 0,
          directionalCtl?.position?.z ?? 0,
        ]}
        castShadow={directionalCtl.castShadow}
        intensity={directionalCtl.intensity}
      />

      <directionalLight
        visible={directionalCtl2.visible}
        position={[
          directionalCtl2?.position?.x ?? 0,
          directionalCtl2?.position?.y ?? 0,
          directionalCtl2?.position?.z ?? 0,
        ]}
        castShadow={directionalCtl2.castShadow}
        intensity={directionalCtl2.intensity}
      />
      {/* New left directional light */}
      <directionalLight
        visible={directionalLeftCtl.visible}
        position={[
          directionalLeftCtl?.position?.x ?? 0,
          directionalLeftCtl?.position?.y ?? 0,
          directionalLeftCtl?.position?.z ?? 0,
        ]}
        castShadow={directionalLeftCtl.castShadow}
        intensity={directionalLeftCtl.intensity}
      />

      {/* New right directional light */}
      <directionalLight
        visible={directionalRightCtl.visible}
        position={[
          directionalRightCtl?.position?.x ?? 0,
          directionalRightCtl?.position?.y ?? 0,
          directionalRightCtl?.position?.z ?? 0,
        ]}
        castShadow={directionalRightCtl.castShadow}
        intensity={directionalRightCtl.intensity}
      />
    </>
  );
};
