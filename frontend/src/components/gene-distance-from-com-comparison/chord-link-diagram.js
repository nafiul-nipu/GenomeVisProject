import * as d3 from "d3";
import { useMemo, useState } from "react";

const textPadding = 1.2;
export const ChordLinkDiagram = ({
  data,
  setChordSelection,
  before,
  after,
  chordClicked,
  setChordClicked,
}) => {
  const height = useMemo(() => {
    return (30 * window.innerHeight) / 100;
  }, [window.innerHeight]);
  const width = useMemo(() => {
    return (30 * window.innerHeight) / 100;
  }, [window.innerHeight]);

  // console.log(height, width);

  const outerRadius = Math.min(width, height) * 0.5 - 38;
  const innerRadius = outerRadius - 10;

  const ribbon = d3
    .ribbonArrow()
    .radius(innerRadius - 1)
    .padAngle(0 / innerRadius);

  const chordArc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const chord = d3
    .chordDirected()
    .padAngle(10 / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

  const chords = chord(data);

  // console.log(chords);

  const names = data.names === undefined ? d3.range(data.length) : data.names;
  const colors =
    data.colors === undefined
      ? d3.quantize(d3.interpolateRainbow, names.length)
      : data.colors;
  const color = d3.scaleOrdinal(names, colors);

  const handleChordSelection = (d) => {
    const beforeGene =
      before[d.source.index][Object.keys(before[d.source.index])[0]];
    const afterGene =
      after[d.target.index][Object.keys(after[d.target.index])[0]];
    // console.log(beforeGene, afterGene);

    const commonGene = beforeGene.filter((gene) => afterGene.includes(gene));

    // console.log(commonGene);

    setChordClicked({ source: d.source.index, target: d.target.index });
    setChordSelection(commonGene);
  };

  return (
    <svg height={height} width={width}>
      <g transform={`translate(${width / 2}, ${width / 2})`}>
        {chords.groups.map((each) => {
          let textTransform = chordArc.centroid(each);
          // console.log(each);
          return (
            <g key={each.index}>
              <path fill={color(names[each.index])} d={chordArc(each)} />
              <title>{`${names[each.index]}
                                                ${each.value}`}</title>
              <text
                transform={`translate(${textTransform[0] * textPadding}, ${
                  textTransform[1] * textPadding
                })`}
                // x={2}
                dy="0.35em"
                // fontWeight={'bold'}
                fontSize="0.75em"
                textAnchor={"middle"}
              >
                {names[each.index]}
              </text>
            </g>
          );
        })}
        {chords.map((each, i) => {
          // console.log(each);
          return (
            <g fillOpacity={0.8} key={i}>
              <path
                style={{ mixBlendMode: "multiply" }}
                fill={
                  chordClicked?.source === each.source.index &&
                  chordClicked?.target === each.target.index
                    ? "#4285F4"
                    : color(names[each.source.index])
                }
                d={ribbon(each)}
                onClick={(d) => {
                  handleChordSelection(each);
                }}
              />
              <title>{`${names[each.source.index]} → ${
                names[each.target.index]
              } = ${each.source.value}`}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
