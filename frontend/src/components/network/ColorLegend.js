// ColorLegend.js
import React from "react";
import * as d3 from "d3";

const ColorLegend = ({
  percentile10,
  percentile90,
  min,
  max,
  height = 50,
  margin = { top: 0, right: 30, bottom: 0, left: 30 },
}) => {
  const width = window.innerWidth / 4.5;
  // Define the color scale
  const colorScale = d3
    .scaleLinear()
    .domain([min, percentile10, percentile90, max])
    .range(["#f2f0f7", "#f2f0f7", "#54278f", "#54278f"]);

  // Define gradient stops
  const stops = [
    { offset: "0%", color: colorScale(min) },
    { offset: `${percentile10}%`, color: colorScale(percentile10) },
    { offset: `${percentile90}%`, color: colorScale(percentile90) },
    { offset: "100%", color: colorScale(max) },
  ];

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="0%">
          {stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={margin.left}
        y={10}
        width={width - margin.left - margin.right}
        height={20}
        fill="url(#gradient)"
      />
      <text x={10} y={35} fontSize="12px" alignmentBaseline="middle">
        {min.toFixed(1)}
      </text>
      <text
        x={`${percentile10 + 8}%`}
        y={35}
        fontSize="12px"
        alignmentBaseline="middle"
      >
        {percentile10.toFixed(1)}
      </text>
      <text
        x={`${percentile90 + 7}%`}
        y={35}
        fontSize="12px"
        alignmentBaseline="middle"
      >
        {percentile90.toFixed(1)}
      </text>
      <text x={width - 50} y={35} fontSize="12px" alignmentBaseline="middle">
        {max.toFixed(1)}
      </text>
    </svg>
  );
};

export default ColorLegend;
