import { scaleLinear } from "d3";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Color, Object3D } from "three";

const object = new Object3D();

// const colorScale = scaleSequential().interpolator(
//   // interpolateRgbBasis(["purple", "green", "orange"])
//   interpolateBlues
// );

const colorScale = scaleLinear().range(["#f2f0f7", "#54278f"]);

const AccSpehereRendererWithOpacity = (props) => {
  const accMount = useRef(false);
  const meshRef = useRef();

  // on mount
  useLayoutEffect(() => {
    accMount.current = true;

    meshRef.current.setColorAt(0, new Color());

    return () => {
      accMount.current = false;
    };
  }, []);

  // instancing
  useLayoutEffect(() => {
    if (!accMount.current) return;

    colorScale.domain([
      // props.domain_min,
      props.percentile10,
      props.percentile90,
      // props.domain_max,
    ]);
    // console.log(props.min, props.max);

    // console.log(props.acc_data);

    props.acc_data.forEach((node, index) => {
      object.scale.set(0, 0, 0);

      object.position.set(
        node.middle_pos[0],
        node.middle_pos[1],
        node.middle_pos[2]
      );
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);

      // console.log(colorScale(node.accessibility));
      // Determine the color based on node.value
      const color =
        node.value < props.percentile10
          ? colorScale(props.percentile10) // Color for values below percentile10
          : node.value > props.percentile90
          ? colorScale(props.percentile90) // Color for values above percentile90
          : colorScale(node.value); // Color for values within the range

      meshRef.current.setColorAt(index, new Color(color));
    });

    meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [props.acc_data]);

  // handle radius, filter, chr range change
  useEffect(() => {
    colorScale.domain([
      // props.domain_min,
      props.percentile10,
      props.percentile90,
      // props.domain_max,
    ]);

    // console.log(props.chrRange);

    props.acc_data.forEach((node, index) => {
      if (node.value >= props.accRange[0] && node.value <= props.accRange[1]) {
        if (props.chrRange === null) {
          object.scale.set(0, 0, 0);
        } else {
          // Determine the color based on node.value
          const color =
            node.value < props.percentile10
              ? colorScale(props.percentile10) // Color for values below percentile10
              : node.value > props.percentile90
              ? colorScale(props.percentile90) // Color for values above percentile90
              : colorScale(node.value); // Color for values within the range
          if (
            node.start_id >= props.chrRange[0] &&
            node.end_id <= props.chrRange[1]
          ) {
            object.scale.set(0, 0, 0);
          } else {
            object.scale.set(props.accSlider, props.accSlider, props.accSlider);
            meshRef.current.setColorAt(index, new Color(color));
          }
        }
      } else {
        object.scale.set(0, 0, 0);
      }

      object.position.set(
        node.middle_pos[0],
        node.middle_pos[1],
        node.middle_pos[2]
      );
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);
      // meshRef.current.setColorAt(index, new Color(colorScale(node.value)));
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [props.accSlider, props.accRange, props.chrRange]);

  return (
    <instancedMesh
      ref={meshRef}
      frustumCulled={true}
      args={[null, null, props.acc_data.length]}
    >
      {/* if needed to lower the resolution to handle many points */}
      {/* <sphereGeometry args={[0.25, 6, 3]} />*/}
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshPhongMaterial transparent opacity={0.2} />
    </instancedMesh>
  );
};

export default AccSpehereRendererWithOpacity;
