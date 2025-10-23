import type { LightSettings } from "../../types/data_types_interfaces";

export const Lights = ({ settings }: { settings: LightSettings }) => {
  const s = settings;
  return (
    <>
      <ambientLight
        visible={s.ambient.visible}
        intensity={s.ambient.intensity}
      />

      <directionalLight
        visible={s.dirFront.visible}
        position={s.dirFront.position}
        castShadow={s.dirFront.castShadow}
        intensity={s.dirFront.intensity}
      />
      <directionalLight
        visible={s.dirBack.visible}
        position={s.dirBack.position}
        castShadow={s.dirBack.castShadow}
        intensity={s.dirBack.intensity}
      />
      <directionalLight
        visible={s.dirLeft.visible}
        position={s.dirLeft.position}
        castShadow={s.dirLeft.castShadow}
        intensity={s.dirLeft.intensity}
      />
      <directionalLight
        visible={s.dirRight.visible}
        position={s.dirRight.position}
        castShadow={s.dirRight.castShadow}
        intensity={s.dirRight.intensity}
      />
    </>
  );
};
