import { extent, interpolateReds, scaleSequential } from "d3";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Color, Object3D } from "three";

const object = new Object3D();

const colorScale = scaleSequential().interpolator(interpolateReds);

const GeneSphereRendererWithOpacity = (props) => {
  const geneMount = useRef(false);
  const meshRef = useRef();

  // on mount
  useLayoutEffect(() => {
    geneMount.current = true;

    meshRef.current.setColorAt(0, new Color());

    return () => {
      geneMount.current = false;
    };
  }, []);

  // instancing
  useLayoutEffect(() => {
    if (!geneMount.current) return;

    // console.log("inside with opacity");

    const domain = extent(props.gene_data, (item) => item.distance_from_com);
    colorScale.domain([domain[1], domain[0]]);

    props.gene_data.forEach((node, index) => {
      object.scale.set(0, 0, 0);

      object.position.set(
        node.middle_pos[0],
        node.middle_pos[1],
        node.middle_pos[2]
      );
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);

      meshRef.current.setColorAt(
        index,
        new Color(colorScale(node.distance_from_com))
      );
    });
    meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [props.gene_data]);

  // handle radius change and gene selection
  useEffect(() => {
    // console.log("inside opacity sliders or something changed");
    // console.log(props.geneName);
    props.gene_data.forEach((node, index) => {
      if (props.chrRange === null) {
        const color =
          props.geneName === "All"
            ? colorScale(node.distance_from_com)
            : node.name === props.geneName
            ? "#FF69B4"
            : "#808080";

        if (props.chordSelection) {
          if (props.chordSelection.includes(node.name)) {
            object.scale.set(0, 0, 0);
          } else {
            object.scale.set(
              props.geneSlider,
              props.geneSlider,
              props.geneSlider
            );
            meshRef.current.setColorAt(index, new Color(color));
          }
        } else {
          object.scale.set(0, 0, 0);
        }
      } else {
        const color =
          props.geneName === "All"
            ? colorScale(node.distance_from_com)
            : node.name === props.geneName
            ? "#FF69B4"
            : "#808080";
        if (
          node.start_id >= props.chrRange[0] &&
          node.end_id <= props.chrRange[1]
        ) {
          if (props.chordSelection) {
            if (props.chordSelection.includes(node.name)) {
              //   meshRef.current.setColorAt(index, new Color(color));
              object.scale.set(0, 0, 0);
            } else {
              object.scale.set(
                props.geneSlider,
                props.geneSlider,
                props.geneSlider
              );
              meshRef.current.setColorAt(index, new Color(color));
            }
          } else {
            object.scale.set(0, 0, 0);
            // meshRef.current.setColorAt(index, new Color(color));
          }
        } else {
          object.scale.set(
            props.geneSlider,
            props.geneSlider,
            props.geneSlider
          );
          meshRef.current.setColorAt(index, new Color(color));
        }
      }

      object.position.set(
        node.middle_pos[0],
        node.middle_pos[1],
        node.middle_pos[2]
      );
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [props.geneSlider, props.geneName, props.chordSelection, props.chrRange]);

  return (
    <instancedMesh
      ref={meshRef}
      frustumCulled={true}
      args={[null, null, props.gene_data.length]}
    >
      {/* if needed to lower the resolution to handle many points */}
      {/* <sphereGeometry args={[0.25, 12, 12]} /> */}
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshPhongMaterial transparent opacity={0.25} />
    </instancedMesh>
  );
};

export default GeneSphereRendererWithOpacity;
