import { color, scaleLinear } from "d3";
import React, { useRef, useEffect, useLayoutEffect, useMemo } from "react";

import {
  BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Mesh,
  Matrix4,
  Vector3,
  CatmullRomCurve3,
  TubeGeometry,
  MeshPhongMaterial,
  Color,
  BufferGeometry,
} from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

const colorScale = scaleLinear().range(["#f2f0f7", "#54278f"]);

export const GeneAccWithTubeRenderer = ({
  data,
  radius,
  edgectl,
  percentile10,
  percentile90,
  accRange,
}) => {
  const tubesRef = useRef();
  const tubesMeshRef = useRef();

  const tubeData = useMemo(() => {
    const numTubes = data.length;

    const temp = data;
    // const temp = [data[161]];
    // console.log(temp[0].gene_with_acc);

    let bufferPositions = [];
    let pathsPositions = [];
    let colorValues = [];
    // console.log(data);
    for (let each of temp) {
      let acc_values = each.gene_with_acc.map((d) => d.value);
      let range =
        accRange !== null
          ? acc_values.some((d) => d >= accRange[0] && d <= accRange[1])
          : true;

      // console.log(range);

      if (range === true) {
        //   console.log(each);
        bufferPositions.push(...each.gene_with_acc[0].start_pos);
        bufferPositions.push(
          ...each.gene_with_acc[each.gene_with_acc.length - 1].end_pos
        );

        let pathPosition = [
          new Vector3().fromArray(each.gene_with_acc[0].start_pos),
        ];
        each.gene_with_acc.forEach((seg) => {
          pathPosition.push(new Vector3().fromArray(seg.end_pos));
        });
        pathsPositions.push(pathPosition);

        //TODO: add color later
        let values = each.gene_with_acc.map((d) => d.value);
        // values = [1.6, 5, 20];
        //   console.log(values);
        colorValues.push(values);
      }
    }

    const geometry = new InstancedBufferGeometry();
    const positionAttribute = new BufferAttribute(
      new Float32Array(bufferPositions),
      3
    );

    geometry.setAttribute("position", positionAttribute);

    const numInstances = pathsPositions.length;
    const instanceMatrix = new InstancedBufferAttribute(
      new Float32Array(numInstances * 16),
      16
    );

    geometry.setAttribute("instanceMatrix", instanceMatrix);

    const matrix = new Matrix4();

    const tubeGeometries = [];

    for (let i = 0; i < pathsPositions.length; i++) {
      const numberSegments = pathsPositions[i].length - 1;
      //   console.log(numberSegments);
      const curve = new CatmullRomCurve3(pathsPositions[i]);
      const tubeGeometry = new TubeGeometry(
        curve,
        numberSegments * 4,
        0.05,
        8,
        false
      );
      colorScale.domain([percentile10, percentile90]);

      const colorsArray = [];
      const numVertices = tubeGeometry.attributes.position.count;
      // console.log(numVertices);
      // Calculate colors for each segment
      for (let j = 0; j < numVertices; j++) {
        const vertexPosition = new Vector3().fromBufferAttribute(
          tubeGeometry.attributes.position,
          j
        );
        const normalizedPosition =
          vertexPosition.clone().sub(pathsPositions[i][0]).length() /
          pathsPositions[i][pathsPositions[i].length - 1].distanceTo(
            pathsPositions[i][0]
          );

        const segmentIndex = Math.floor(
          normalizedPosition * (numberSegments - 1)
        );

        const colorValueFromScale =
          colorValues[i][segmentIndex] < percentile10
            ? colorScale(percentile10)
            : colorValues[i][segmentIndex] > percentile90
            ? colorScale(percentile90)
            : colorScale(colorValues[i][segmentIndex]);

        const color = new Color(colorValueFromScale);
        colorsArray.push(color.r, color.g, color.b);
      }
      tubeGeometry.setAttribute(
        "color",
        new BufferAttribute(new Float32Array(colorsArray), 3)
      );

      // console.log(tubeGeometry);
      // console.log(colorsArray);
      tubeGeometries.push(tubeGeometry);

      matrix.makeTranslation(
        pathsPositions[i][0].x,
        pathsPositions[i][0].y,
        pathsPositions[i][0].z
      );

      matrix.lookAt(
        pathsPositions[i][0], // Start
        pathsPositions[i][numberSegments], // End
        new Vector3(0, 1, 0) // Up
      );

      matrix.toArray(instanceMatrix.array, i * 16);
    }

    instanceMatrix.needsUpdate = true;

    return { bufferPositions, tubeGeometries };
  }, [data, percentile10, percentile90, accRange]);
  //radius

  useLayoutEffect(() => {
    const tubes = tubesRef.current;

    if (tubesMeshRef.current) {
      tubes.remove(tubesMeshRef.current);
    }

    const combinedGeometry =
      tubeData.tubeGeometries.length > 0
        ? BufferGeometryUtils.mergeGeometries(tubeData.tubeGeometries)
        : new BufferGeometry();

    const material = new MeshPhongMaterial({
      vertexColors: true,
      color: edgectl.color,
      emissive: edgectl.emissive,
      specular: edgectl.specular,
      shininess: edgectl.shininess,
    });

    const tubesMesh = new Mesh(combinedGeometry, material);
    tubesMesh.frustumCulled = true;
    tubes.add(tubesMesh);
    tubesMeshRef.current = tubesMesh;
  }, [edgectl, tubeData]);
  return <group ref={tubesRef} frustumCulled />;
};
