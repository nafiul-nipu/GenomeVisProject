import { scaleLinear } from "d3";
import { use, useEffect, useLayoutEffect, useRef } from "react";
import { Color, Object3D, Vector3 } from "three";

const colorScale = scaleLinear().range(["#f2f0f7", "#54278f"]);
const object = new Object3D();
export const GeneWithAccCylinderRenderer = (props) => {
  const mount = useRef(false);
  const meshRef = useRef();

  useLayoutEffect(() => {
    mount.current = true;

    meshRef.current.setColorAt(0, new Color());

    return () => {
      mount.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!mount.current) return;

    let temp = props.data[300];
    temp.gene_with_acc.forEach((gene, index) => {
      let start_pos = new Vector3().fromArray(gene.start_pos);
      let end_pos = new Vector3().fromArray(gene.end_pos);

      object.position.set(start_pos.x, start_pos.y, start_pos.z);
      object.scale.z = start_pos.distanceTo(end_pos);
      object.lookAt(end_pos);

      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);

      meshRef.current.setColorAt(index, new Color(0x0000ff));
    });
    meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [props.data]);

  return (
    <instancedMesh
      ref={meshRef}
      frustumCulled={true}
      args={[null, null, props.data[300].length]}
    >
      <cylinderGeometry args={[1, 1, 1]} />
      <meshPhongMaterial />
    </instancedMesh>
  );
};
