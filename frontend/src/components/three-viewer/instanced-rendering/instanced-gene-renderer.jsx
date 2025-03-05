import { extent, interpolateReds, scaleSequential } from "d3";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Color, Object3D } from "three";

const object = new Object3D();

const colorScale = scaleSequential().interpolator(interpolateReds);

const GeneSphereRenderer = (props) => {
  const geneMount = useRef(false);
  const meshRef = useRef();

  // on mount
  useLayoutEffect(() => {
    console.log("gene sphere renderer mounted");
    geneMount.current = true;

    meshRef.current.setColorAt(0, new Color());

    return () => {
      geneMount.current = false;
    };
  }, []);

  // instancing
  useLayoutEffect(() => {
    if (!geneMount.current) return;
    console.log("gene sphere rendering started");

    const domain = extent(props.gene_data, (item) => item.distance_from_com);
    colorScale.domain([domain[1], domain[0]]);

    props.gene_data.forEach((node, index) => {
      // console.log(node);
      if (node.radius) {
        // console.log('radius found')
        let radii = parseFloat(node.radius);
        object.scale.set(radii, radii, radii);
      } else {
        object.scale.set(1, 1, 1);
      }

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
    console.log("gene filter changed");
    // console.log(props.geneName);
    props.gene_data.forEach((node, index) => {
      object.scale.set(props.geneSlider, props.geneSlider, props.geneSlider);

      if (props.chrRange === null) {
        // no chromose range is selected, show all data
        const color =
          props.geneName === "All"
            ? colorScale(node.distance_from_com)
            : node.name === props.geneName
            ? "#FF69B4"
            : "#808080";

        if (props.chordSelection) {
          // chord is selected
          if (props.chordSelection.includes(node.name)) {
            object.scale.set(
              props.geneSlider,
              props.geneSlider,
              props.geneSlider
            );
            meshRef.current.setColorAt(index, new Color(color));
          } else {
            object.scale.set(0, 0, 0);
            // meshRef.current.setColorAt(index, new Color("#808080"));
          }
        } else {
          object.scale.set(
            props.geneSlider,
            props.geneSlider,
            props.geneSlider
          );
          meshRef.current.setColorAt(index, new Color(color));
        }
      } else {
        // chromosome range is selected
        if (
          node.start_id >= props.chrRange[0] &&
          node.end_id <= props.chrRange[1]
        ) {
          const color =
            props.geneName === "All"
              ? colorScale(node.distance_from_com)
              : node.name === props.geneName
              ? "#FF69B4"
              : "#808080";

          if (props.chordSelection) {
            if (props.chordSelection.includes(node.name)) {
              object.scale.set(
                props.geneSlider,
                props.geneSlider,
                props.geneSlider
              );
              meshRef.current.setColorAt(index, new Color(color));
            } else {
              object.scale.set(0, 0, 0);
              // meshRef.current.setColorAt(index, new Color("#808080"));
            }
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
          // meshRef.current.setColorAt(index, new Color("#848884"));
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
      <meshPhongMaterial />
    </instancedMesh>
  );
};

export default GeneSphereRenderer;
