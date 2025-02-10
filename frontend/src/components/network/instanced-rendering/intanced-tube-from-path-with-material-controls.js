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
} from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Define color mapping for centromere values
const tubeColorMap = {
  "-1": new Vector3(1, 0, 0), // red
  0: new Vector3(1, 1, 1), // white
  1: new Vector3(0, 0, 1), // blue
};

export default function InstancedTubeRendererFromPathMaterial({
  edges,
  paths,
  nodes,
  radius,
  edgectl,
  toggleGene,
  tubeColor,
}) {
  const tubesRef = useRef();
  const tubesMeshRef = useRef();

  const tubeData = useMemo(() => {
    const numTubes = paths.length;

    let bufferPositions = [];
    let pathsPositions = [];
    let colorValues = []; // To store centromere values for each tube

    for (let path of paths) {
      bufferPositions.push(...nodes[path[0] - 1].coord);
      bufferPositions.push(...nodes[path[path.length - 1] - 1].coord);
      let pathPosition = [];
      for (let i = 0; i < path.length; i++) {
        let pos = new Vector3().fromArray(nodes[path[i] - 1].coord);
        pathPosition.push(pos);
      }
      pathsPositions.push(pathPosition);

      let values;
      if (tubeColor === "centromere") {
        values = path.map((nodeId) => nodes[nodeId - 1].centromere);
      } else if (tubeColor === "compartment") {
        values = path.map((nodeId) => nodes[nodeId - 1].compartment);
      } else {
        // add value 0 to all nodes
        values = path.map((nodeId) => 0);
      }
      colorValues.push(values);
    }

    const geometry = new InstancedBufferGeometry();
    const positionAttribute = new BufferAttribute(
      new Float32Array(bufferPositions),
      3
    );
    geometry.setAttribute("position", positionAttribute);

    const numInstances = numTubes;
    const instanceMatrix = new InstancedBufferAttribute(
      new Float32Array(numInstances * 16),
      16
    );
    geometry.setAttribute("instanceMatrix", instanceMatrix);

    const matrix = new Matrix4();

    const tubeGeometries = [];

    for (let i = 0; i < pathsPositions.length; i++) {
      const numberSegments = pathsPositions[i].length - 1;
      const curve = new CatmullRomCurve3(pathsPositions[i]);
      const tubeGeometry = new TubeGeometry(
        curve,
        numberSegments * 4,
        radius,
        8,
        false
      );

      // Create colors based on centromere values
      const colorsArray = [];
      //iterates through each vertex of the tube geometry
      for (let j = 0; j < tubeGeometry.attributes.position.count; j++) {
        // Average centromere value for the segment
        // determines which segment of the tube the current vertex belongs to.
        // It divides the total number of vertices by the number of segments to find the average segment index
        const segmentIndex = Math.floor(
          j / (tubeGeometry.attributes.position.count / colorValues[i].length)
        );
        const colorValue = colorValues[i][segmentIndex];
        const color = tubeColorMap[colorValue] || new Vector3(0.5, 0.5, 0.5); // Default color if not found

        // console.log(color);
        colorsArray.push(...color.toArray());
      }
      // console.log(colorsArray);

      tubeGeometry.setAttribute(
        "color",
        new BufferAttribute(new Float32Array(colorsArray), 3)
      );

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
  }, [edges, paths, nodes, radius, tubeColor]);

  useLayoutEffect(() => {
    const tubes = tubesRef.current;

    if (toggleGene === true) {
      if (tubesMeshRef.current) {
        tubes.remove(tubesMeshRef.current);
        tubesMeshRef.current = null;
      }
      return;
    }

    // console.log("number of connections", edges.length);
    // console.log("tube rendering started");

    if (tubesMeshRef.current) {
      tubes.remove(tubesMeshRef.current);
    }

    const combinedGeometry = BufferGeometryUtils.mergeGeometries(
      tubeData.tubeGeometries
    );

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

    // console.log("tube created");
  }, [edgectl, tubeData, toggleGene]);

  return <group ref={tubesRef} frustumCulled />;
}
