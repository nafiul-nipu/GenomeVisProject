import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Color, InstancedMesh } from "three";
import type { GeneSphereViewProps } from "../../types/data_types_interfaces";

// import * as d3 from "d3";
import { positionPicker } from "../../utilFunctions/positionPicker";
import { colorPaletteSelector } from "../../utilFunctions/colorForViews";
import { useAppDispatch } from "../../redux-store/hooks";
import { setHoveredGene } from "../../redux-store/uiSlice";
import type { ThreeEvent } from "@react-three/fiber";

// const colorScale = d3.scaleSequential().interpolator(d3.interpolateReds);
const object = new Object3D();

export const GeneSphereView: React.FC<GeneSphereViewProps> = ({
  label,
  geneColorPickerIdx,
  data,
  positionMode,
  nodeCtl,
  highlightedIdxs = [],
  hoveredIdx = null,
}) => {
  const dispatch = useAppDispatch();
  const highlightset = useMemo(
    () => new Set(highlightedIdxs),
    [highlightedIdxs]
  );
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
      //   object.scale.set(
      //     nodeCtl.geneRadius,
      //     nodeCtl.geneRadius,
      //     nodeCtl.geneRadius
      //   );
      //   const [x, y, z] = positionPicker(item, positionMode);
      //   object.position.set(x, y, z);

      //   object.updateMatrix();
      //   mesh.setMatrixAt(i, object.matrix);

      //   // const color = new Color(colorScale(item.cluster) || "#ffffff");
      //   // console.log(color);
      //   // console.log(new Color("#ffffff"));
      //   // mesh.setColorAt(i, new Color("#ffffff"));
      //   mesh.setColorAt(
      //     i,
      //     new Color(colorPaletteSelector(geneColorPickerIdx ?? 0))
      //   );
      // });
      // mesh.instanceMatrix.needsUpdate = true;
      // mesh.instanceColor!.needsUpdate = true;

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

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId == null) return;
    dispatch(setHoveredGene({ label, idx: e.instanceId }));
  };

  const handlePointerOut = () => {
    dispatch(setHoveredGene(null));
  };

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
