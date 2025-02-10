import React, { useMemo } from "react";
import { extent, scaleLinear } from "d3";
import styles from "../../styles/Home.module.css";
import { chain_colors } from "../network/instanced-rendering/chainColors";

const margin = { top: 10, right: 30, bottom: 30, left: 30 };

export const NodeDetails = ({ node, data, nodeStyles }) => {
  // console.log(data?.nodes[node])
  // console.log(node)

  // id starts from 1, index starts from 0 so node id = node + 1
  const sourceArray = node
    ? data.edges
        .filter((item) => item.source === node + 1)
        .map((item) => item.target)
    : [];
  const targetArray = node
    ? data.edges
        .filter((item) => item.target === node + 1)
        .map((item) => item.source)
    : [];

  const sourceNodes = node
    ? data.nodes.filter((item) => sourceArray.includes(item.id))
    : [];
  const targetNodes = node
    ? data.nodes.filter((item) => targetArray.includes(item.id))
    : [];

  const merged = node ? [...sourceNodes, ...targetNodes, data.nodes[node]] : [];
  // Convert the nodes array to a Set to remove duplicates
  const nodes = [...new Set(merged)];
  // console.log(sourceArray)
  // console.log(sourceNodes)
  // console.log(targetArray)
  // console.log(targetNodes)
  // console.log(merged)
  // console.log(nodes)

  const links = node
    ? data.edges.filter(
        (item) => item.source === node + 1 || item.target === node + 1
      )
    : [];
  // console.log(links)

  const width = useMemo(() => {
    return (16 * window.innerWidth) / 100;
  }, [window.innerWidth]);

  const height = useMemo(() => {
    return (18 * window.innerHeight) / 100;
  }, [window.innerHeight]);

  const xScale = scaleLinear()
    .domain(extent(nodes, (item) => item.coord[0]))
    .range([0, width - margin.left - margin.right]);

  const yScale = scaleLinear()
    .domain(extent(nodes, (item) => item.coord[1]))
    .range([height - margin.top - margin.bottom, 0]);

  const handleClick = (geneId) => {
    console.log(geneId);
  };

  return (
    <div className={styles[nodeStyles]}>
      <span style={{ alignItems: "center" }}>
        <b>Node Details</b>
      </span>{" "}
      <br />
      {node
        ? Object.keys(data.nodes[node]).map((item, index) => {
            if (
              item !== "coord" &&
              item !== "x" &&
              item !== "y" &&
              item !== "z"
            ) {
              return (
                <React.Fragment key={index}>
                  <span key={index}>
                    {item}: {data.nodes[node][item]}
                  </span>{" "}
                  <br />
                </React.Fragment>
              );
            }
          })
        : null}
      <span>
        <span>Links </span> <br />
        {/* <span>To: {sourceArray.join(', ')}</span> <br/>
                <span>From: {targetArray.join(' , ')}</span> */}
      </span>
      <div className={styles.svgContainer}>
        <svg width={width} height={height}>
          <g transform={`translate(20, ${margin.top})`}>
            {nodes.map((item, index) => (
              <g key={index}>
                <circle
                  key={index}
                  cx={xScale(item.coord[0])}
                  cy={yScale(item.coord[1])}
                  r={7}
                  fill={
                    item.id === node + 1 ? "#FF69B4" : chain_colors[item.chain]
                  }
                />
                <text
                  x={xScale(item.coord[0]) + 5}
                  y={yScale(item.coord[1]) + 5}
                  fontSize="10px"
                  fill="black"
                >
                  {item.id}
                </text>
              </g>
            ))}
            {links.map((item, index) => (
              <line
                key={index}
                x1={xScale(data.nodes[item.source - 1].coord[0])}
                y1={yScale(data.nodes[item.source - 1].coord[1])}
                x2={xScale(data.nodes[item.target - 1].coord[0])}
                y2={yScale(data.nodes[item.target - 1].coord[1])}
                stroke="black"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};
