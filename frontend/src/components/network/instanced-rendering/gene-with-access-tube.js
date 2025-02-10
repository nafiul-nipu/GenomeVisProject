import {
  CatmullRomLine,
  Line,
  Merged,
  Tube,
  Bounds,
  Center,
} from "@react-three/drei";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import * as d3 from "d3";
import { useThree } from "@react-three/fiber";

// Function to map value to color
const getColorFromValue = (value) => {
  const colorScale = d3
    .scaleSequential(d3.interpolateViridis)
    .domain([0.51, 40]);
  return new THREE.Color(colorScale(value));
};

export const DrawGeneWithAcc = ({ data }) => {
  const [lineData, setLineData] = useState(null);

  const viewport = useThree((state) => state.viewport);

  useLayoutEffect(() => {
    console.log(data);
    let linePoints = [];
    for (let i = 0; i < data.length; i++) {
      let points = [];
      for (let j = 0; j < data[i].gene_with_acc.length; j++) {
        let pos = data[i].gene_with_acc[j].start_pos;
        points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
      }
      let pos = data[i].gene_with_acc[data[i].gene_with_acc.length - 1].end_pos;
      points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));

      linePoints.push(points);
    }
    setLineData(linePoints);
  }, [data]);

  return (
    <React.Fragment>
      {lineData
        ? lineData.map((line, index) => {
            // console.log(line);
            return (
              <Line key={index} points={line} color="black" lineWidth={2} />
            );
          })
        : null}
    </React.Fragment>
  );
};
