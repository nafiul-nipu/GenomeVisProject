import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Object3D, Color, InstancedMesh, Raycaster, Vector2 } from "three";
import type { GeneSphereViewProps } from "../../types/data_types_interfaces";

// import * as d3 from "d3";
import { positionPicker } from "../../utilFunctions/positionPicker";
import { colorPaletteSelector } from "../../utilFunctions/colorForViews";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import { setHoveredGene } from "../../redux-store/uiSlice";
import { useThree, type ThreeEvent } from "@react-three/fiber";

// const colorScale = d3.scaleSequential().interpolator(d3.interpolateReds);
const object = new Object3D();

export const GeneSphereView: React.FC<GeneSphereViewProps> = ({
  label,
  viewRef,
  geneColorPickerIdx,
  data,
  positionMode,
  nodeCtl,
  highlightedIdxs = [],
  hoveredIdx = null,
}) => {
  const dispatch = useAppDispatch();
  const selectedGenes = useAppSelector((s) => s.ui.selectedGenes);

  // indices to highlight:
  // - ones coming from 2D (highlightedIdxs)
  // - plus any whose gene_name is in selectedGenes from dropdown
  const highlightset = useMemo(() => {
    const set = new Set<number>(highlightedIdxs);

    if (selectedGenes.length) {
      data.forEach((item, idx) => {
        if (selectedGenes.includes(item.gene_name)) {
          set.add(idx);
        }
      });
    }

    return set;
  }, [highlightedIdxs, selectedGenes, data]);
  // console.log(data);
  const geneSphereViewMount = useRef<boolean>(false);
  const meshRef = useRef<InstancedMesh | null>(null);

  // raycasting state
  const { camera } = useThree();
  const [raycaster] = useState(() => new Raycaster());
  const [mouse, setMouse] = useState<Vector2 | null>(null);

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

    data.forEach((item, i) => {
      const [x, y, z] = positionPicker(item, positionMode);
      const scaleBase = nodeCtl.geneRadius;
      let scale = scaleBase;

      const isHighlighted = highlightset.has(i);
      const isHovered = hoveredIdx === i;

      if (isHighlighted) scale *= 1.25;
      if (isHovered) scale *= 1.4;

      object.scale.set(scale, scale, scale);
      object.position.set(x, y, z);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);

      const baseColor = new Color(
        colorPaletteSelector(geneColorPickerIdx ?? 0)
      );
      const highlightColor = new Color("#f97316");

      mesh.setColorAt(
        i,
        isHighlighted || isHovered ? highlightColor : baseColor
      );
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    // console.log("gene sphere rendering finished");
  }, [
    data,
    positionMode,
    nodeCtl.geneRadius,
    geneColorPickerIdx,
    highlightset,
    hoveredIdx,
  ]);

  // pointer handlers: just track mouse in NDC, like old NodeRenderer
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    const el = viewRef.current;
    if (!el) {
      setMouse(null);
      dispatch(setHoveredGene(null));
      return;
    }
    const rect = el.getBoundingClientRect();

    setMouse(
      new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
    );
  };

  const handlePointerOut = () => {
    setMouse(null);
    dispatch(setHoveredGene(null));
  };

  // raycast effect: compute which instance is under the mouse
  useEffect(() => {
    if (!meshRef.current || !mouse) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId != null) {
      const idx = intersects[0].instanceId;
      dispatch(setHoveredGene({ label, idx }));
    } else {
      dispatch(setHoveredGene(null));
    }
  }, [mouse, raycaster, camera, dispatch, label]);

  return (
    <instancedMesh
      ref={meshRef}
      frustumCulled={true}
      args={[undefined, undefined, data.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      {/* if needed to lower the resolution to handle many points */}
      {/* <sphereGeometry args={[0.25, 12, 12]} /> */}
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshPhongMaterial
        color={nodeCtl.geneColor}
        emissive={nodeCtl.geneEmissive}
        specular={nodeCtl.geneSpecular}
        shininess={nodeCtl.geneShininess}
      />
    </instancedMesh>
  );
};
