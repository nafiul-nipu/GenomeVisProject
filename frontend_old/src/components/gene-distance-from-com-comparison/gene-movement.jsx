import * as d3 from "d3";
import calculateSubsetGroupAngles from "../../utilities/calculateSubSetGroupAngles";
import createGroupSubset from "../../utilities/createGroupSubset";
import createGeneNetwork from "../../utilities/createGeneNetwork";
import combineBeforeAfter from "../../utilities/combineBeforeAfter";
import findChangedGroups from "../../utilities/findChangedGroups";
import { useMemo } from "react";

const textPadding = 1.2;

export const GeneMovementViewer = ({ before, after, chordData }) => {
  //   console.log("before groups");
  //   console.log(before);
  //   console.log("after groups");
  //   console.log(after);
  //   console.log("chord data matrix");
  //   console.log(chordData);

  const height = useMemo(() => {
    return (70 * window.innerHeight) / 100;
  }, [window.innerHeight]);

  const width = useMemo(() => {
    return (70 * window.innerHeight) / 100;
  }, [window.innerHeight]);

  const outerRadius = Math.min(width, height) * 0.5 - 60;
  const innerRadius = outerRadius - 10;

  const names =
    chordData.names === undefined
      ? d3.range(chordData.length)
      : chordData.names;
  const colors =
    chordData.colors === undefined
      ? d3.quantize(d3.interpolateRainbow, names.length)
      : chordData.colors;
  const color = d3.scaleOrdinal(names, colors);

  const groupArc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const chord = d3.chordDirected().padAngle(10 / innerRadius);
  // .sortSubgroups(d3.descending)
  // .sortChords(d3.descending);

  const groupChords = chord(chordData);

  //   console.log("after applying d3.chord");
  // console.log(groupChords);

  const combineGroups = combineBeforeAfter(before, after);
  //   console.log("combine groups");
  //   console.log(combineGroups);

  //   console.log("create group subset");
  const groupSubset = createGroupSubset(combineGroups, chordData.names);
  //   console.log(groupSubset);

  const changedGene = findChangedGroups(before, after);
  //   console.log(changedGene.length);

  //   console.log("calculate subset group angles");
  const groupSubsetWithAngles = calculateSubsetGroupAngles(
    groupChords.groups,
    groupSubset,
    changedGene
  );
  //   console.log(groupSubsetWithAngles);

  const geneLinks = createGeneNetwork(changedGene, groupSubsetWithAngles);

  //   console.log(geneLinks);

  const ribbon = d3
    .ribbonArrow()
    .radius(innerRadius - 1)
    .padAngle(0 / innerRadius);

  return (
    <svg height={height} width={width}>
      <g transform={`translate(${width / 2}, ${width / 2})`}>
        {groupChords.groups.map((each) => {
          let textTransform = groupArc.centroid(each);
          return (
            <g key={each.index}>
              <path fill={color(names[each.index])} d={groupArc(each)} />
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
        {geneLinks.map((each, i) => {
          //   console.log(each);
          return (
            <g fillOpacity={0.8} key={i}>
              <path
                style={{ mixBlendMode: "multiply" }}
                fill={color(names[each.source.index])}
                d={ribbon(each)}
              />
              <title>
                {`${each.source.name} = ${each.source.groupName} → ${each.target.groupName}`}
              </title>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
