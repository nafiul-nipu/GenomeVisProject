import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DrawObjectProps } from "../../types/data_types_interfaces";
import { GeneSphereView } from "./GeneSphereView";
import { positionPicker } from "../../utilFunctions/positionPicker";
import { GeneTubeView } from "./GeneTubeView";

export const DrawObject: React.FC<DrawObjectProps> = ({
  geneColorPickerIdx,
  geneData,
  geneEdges,
  genePaths,
  positionMode,
  nodeCtl,
  tubeCtl,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, controls } = useThree(); // you get the current camera & OrbitControls

  // compute bounding box of all points
  const bbox = useMemo(() => {
    const box = new THREE.Box3();
    for (const item of geneData) {
      const [x, y, z] = positionPicker(item, positionMode);
      box.expandByPoint(new THREE.Vector3(x, y, z));
    }
    return box;
  }, [geneData, positionMode]);

  // center + zoom camera
  useEffect(() => {
    if (!bbox.isEmpty()) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bbox.getSize(size);
      bbox.getCenter(center);

      // center the group so the cloud is at origin
      if (groupRef.current) {
        groupRef.current.position.copy(center).multiplyScalar(-1);
      }

      // fit camera distance (rough heuristic)
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const dist = maxDim / (2 * Math.tan(fov / 2));

      // move camera back along z and look at center
      camera.position.set(center.x, center.y, dist * 1.5);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // if OrbitControls exist, update their target too
      if (controls) {
        // @ts-expect-error -- controls type issue
        controls.target.copy(center);
        // @ts-expect-error -- controls type issue
        controls.update();
      }
    }
  }, [bbox, camera, controls]);

  return (
    <group ref={groupRef}>
      <GeneSphereView
        geneColorPickerIdx={geneColorPickerIdx}
        data={geneData}
        positionMode={positionMode}
        nodeCtl={nodeCtl}
      />
      <GeneTubeView
        geneData={geneData}
        geneEdges={geneEdges}
        genePaths={genePaths}
        positionMode={positionMode}
        tubeCtl={tubeCtl}
      />
    </group>
  );
};
