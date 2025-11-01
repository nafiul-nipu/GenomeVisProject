import { useLayoutEffect, useRef } from "react";
import { Object3D, Color, InstancedMesh } from "three";
import type { GeneSphereViewProps } from "../../types/data_types_interfaces";

// import * as d3 from "d3";
import { positionPicker } from "../../utilFunctions/positionPicker";

// const colorScale = d3.scaleSequential().interpolator(d3.interpolateReds);
const object = new Object3D();

export const GeneSphereView: React.FC<GeneSphereViewProps> = ({
  data,
  positionMode,
}) => {
  // console.log(data);
  const geneSphereViewMount = useRef<boolean>(false);
  const meshRef = useRef<InstancedMesh | null>(null);

  //on mount
  useLayoutEffect(() => {
    // console.log("gene sphere renderer mounted");
    geneSphereViewMount.current = true;
    if (!meshRef.current) return;
    meshRef.current.setColorAt(0, new Color());

    return () => {
      geneSphereViewMount.current = false;
    };
  }, []);

  // instancing
  useLayoutEffect(() => {
    if (!geneSphereViewMount.current) return;
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    // console.log("gene sphere rendering started");

    // const extent = d3.extent(data, (item) => item.cluster);
    // const domain: [number, number] = [extent?.[0] ?? 0, extent?.[1] ?? 0];
    // colorScale.domain([domain[1], domain[0]]);

    data.forEach((item, i) => {
      object.scale.set(0.05, 0.05, 0.05);
      const [x, y, z] = positionPicker(item, positionMode);
      object.position.set(x, y, z);

      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);

      // const color = new Color(colorScale(item.cluster) || "#ffffff");
      // console.log(color);
      // console.log(new Color("#ffffff"));
      mesh.setColorAt(i, new Color("#ffffff"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    // console.log("gene sphere rendering finished");
  }, [data, positionMode]);

  // useEffect(() => {}, []);
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
