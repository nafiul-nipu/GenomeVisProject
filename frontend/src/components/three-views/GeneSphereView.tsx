import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Color, InstancedMesh } from "three";
import type {
  GeneSphereViewProps,
  PositionPicker,
} from "../../types/data_types_interfaces";

import * as d3 from "d3";

const positionPicker: PositionPicker = (item, mode) => {
  switch (mode) {
    case "aligned":
      return [item.aligned_pos[0], item.aligned_pos[1], item.aligned_pos[2]];
    case "middle":
      return [item.middle_x, item.middle_y, item.middle_z];
    case "start":
      return [item.start_x, item.start_y, item.start_z];
    case "end":
      return [item.end_x, item.end_y, item.end_z];
    default:
      return [item.middle_x, item.middle_y, item.middle_z];
  }
};

const colorScale = d3.scaleSequential().interpolator(d3.interpolateReds);

export const GeneSphereView: React.FC<GeneSphereViewProps> = ({
  data,
  positionMode,
}) => {
  console.log(data);
  const geneSphereViewMount = useRef<boolean>(false);
  const meshRef = useRef<InstancedMesh | null>(null);

  const object = useMemo(() => new Object3D(), []);
  //on mount
  useLayoutEffect(() => {
    console.log("gene sphere renderer mounted");
    geneSphereViewMount.current = true;
    if (!meshRef.current) return;
    meshRef.current.setColorAt(0, new Color());

    return () => {
      geneSphereViewMount.current = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (!geneSphereViewMount.current) return;
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    console.log("gene sphere rendering started");

    const extent = d3.extent(data, (item) => item.cluster);
    const domain: [number, number] = [extent?.[0] ?? 0, extent?.[1] ?? 0];
    colorScale.domain([domain[1], domain[0]]);

    data.forEach((item, i) => {
      const [x, y, z] = positionPicker(item, positionMode);
      object.position.set(x, y, z);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);

      const color = new Color(colorScale(item.cluster) || "#ffffff");
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    console.log("gene sphere rendering finished");
  }, [data, positionMode]);
  return (
    <instancedMesh
      ref={meshRef}
      frustumCulled={true}
      args={[undefined, undefined, data.length]}
    >
      {/* if needed to lower the resolution to handle many points */}
      {/* <sphereGeometry args={[0.25, 12, 12]} /> */}
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshPhongMaterial />
    </instancedMesh>
  );
};
