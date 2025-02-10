import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const width = 300;
const height = 100;

const margin = 15;
const left = 40;

const RectanglesVisualization = ({ dataset1, dataset2, datalength }) => {
  const rectWidth = width / d3.max([dataset1.legnth, dataset2.length]) - margin;
  const rectHeight = 45;

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateReds)
    .domain([0, datalength]);

  return (
    <svg>
      <g>
        <g>
          <text x={0} y={height - rectHeight} fontSize="0.75em">
            Before
          </text>
          <g transform={`translate(${left}, 0)`}>
            {dataset1.map((d, i) => {
              // console.log(d[Object.keys(d)[0]].length);
              // console.log(datalength);
              return (
                <g key={i}>
                  <rect
                    x={i * rectWidth}
                    y={(height - rectHeight) / 2}
                    height={rectHeight}
                    width={rectWidth}
                    fill={colorScale(d[Object.keys(d)[0]].length)}
                  />
                  <title>{`${Object.keys(d)[0]} : ${
                    d[Object.keys(d)[0]].length
                  }`}</title>

                  <text
                    x={i * rectWidth + 5}
                    y={height - rectHeight}
                    fontSize="0.75em"
                  >{`${Object.keys(d)[0]} : ${
                    d[Object.keys(d)[0]].length
                  }`}</text>
                </g>
              );
            })}
          </g>
        </g>
        <g>
          <text x={0} y={height} fontSize="0.75em">
            After
          </text>
          <g transform={`translate(${left}, 0)`}>
            {dataset2.map((d, i) => {
              return (
                <g key={i}>
                  <rect
                    x={i * rectWidth}
                    y={(height + rectHeight + 5) / 2}
                    height={rectHeight}
                    width={rectWidth}
                    fill={colorScale(d[Object.keys(d)[0]].length)}
                  />
                  <title>{`${Object.keys(d)[0]} : ${
                    d[Object.keys(d)[0]].length
                  }`}</title>
                  <text x={i * rectWidth + 5} y={height} fontSize="0.75em">{`${
                    Object.keys(d)[0]
                  } : ${d[Object.keys(d)[0]].length}`}</text>
                </g>
              );
            })}
          </g>
        </g>
      </g>
    </svg>
  );
};

export default RectanglesVisualization;
