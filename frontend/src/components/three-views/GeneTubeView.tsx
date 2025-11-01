import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  CatmullRomCurve3,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  TubeGeometry,
  Vector3,
  type Group,
} from "three";
import type { GeneTubeViewProps } from "../../types/data_types_interfaces";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { positionPicker } from "../../utilFunctions/positionPicker";

export const GeneTubeView: React.FC<GeneTubeViewProps> = ({
  geneData,
  geneEdges,
  genePaths,
  positionMode,
}) => {
  // console.log(data);
  // console.log(positionMode);

  const tubesRef = useRef<Group>(null);
  const tubesMeshRef = useRef<Mesh | null>(null);

  const tubeData = useMemo(() => {
    const numTubes: number = genePaths.length;

    const bufferPositions = [];
    const pathsPositions = [];
    const colorValues = []; // To store centromere values for each tube

    for (const path of genePaths) {
      const [x0, y0, z0] = positionPicker(geneData[path[0]], positionMode);
      bufferPositions.push(x0, y0, z0);
      const [x1, y1, z1] = positionPicker(
        geneData[path[path.length - 1]],
        positionMode
      );
      bufferPositions.push(x1, y1, z1);
      const pathPosition = [];
      for (let i = 0; i < path.length; i++) {
        const [x, y, z] = positionPicker(geneData[path[i]], positionMode);
        const pos = new Vector3(x, y, z);
        pathPosition.push(pos);
      }
      pathsPositions.push(pathPosition);

      // let values;
      // if (tubeColor === "centromere") {
      //   values = path.map((nodeId) => nodes[nodeId - 1].centromere);
      // } else if (tubeColor === "compartment") {
      //   values = path.map((nodeId) => nodes[nodeId - 1].compartment);
      // } else {
      //   // add value 0 to all nodes
      //   values = path.map((nodeId) => 0);
      // }
      colorValues.push(genePaths.map(() => 0));
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

    // console.log(pathsPositions);

    for (let i = 0; i < pathsPositions.length; i++) {
      const numberSegments = pathsPositions[i].length - 1;
      const curve = new CatmullRomCurve3(pathsPositions[i]);
      const tubeGeometry = new TubeGeometry(
        curve,
        numberSegments * 4,
        0.001, //radius,
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
        // const segmentIndex = Math.floor(
        //   j / (tubeGeometry.attributes.position.count / colorValues[i].length)
        // );
        // const colorValue = colorValues[i][segmentIndex];
        // const color = tubeColorMap[colorValue] || new Vector3(0.5, 0.5, 0.5); // Default color if not found
        const color = new Vector3(0.5, 0.5, 0.5);
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
  }, [geneEdges, geneData, genePaths, positionMode]);

  useLayoutEffect(() => {
    if (!tubesRef.current) return;
    const edgectl = {
      color: 0xffffff,
      emissive: 0x000000,
      specular: 0x111111,
      shininess: 30,
    };
    const tubes = tubesRef.current;

    // if (toggleGene === true) {
    //   if (tubesMeshRef.current) {
    //     tubes.remove(tubesMeshRef.current);
    //     tubesMeshRef.current = null;
    //   }
    //   return;
    // }

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
  }, [tubeData]);

  return <group ref={tubesRef} frustumCulled />;
};
