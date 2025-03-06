import "..//../App.css";

import SimpleNetwork from "../three-viewer/SimpleNetwork";

export const ContentContainer = (props) => {
  // console.log("content container rendering");
  console.log(props.data);
  return (
    <div className="contentContainer">
      {props.data && (
        <SimpleNetwork
          data={props.data}
          toggleGene={props.toggleGene}
          canvasID={props.canvasID}
          chromosome={props.chromosome}
          atomSlider={props.atomSlider}
          geneSlider={props.geneSlider}
          tubeSlider={props.tubeSlider}
          geneName={props.gene_name}
          chordSelection={props.chordSelection}
          accSlider={props.accSlider}
          accRange={props.accRange}
          chrRange={props.chrRange}
          viewTitles={props.viewTitles}
          geneWithAcc={props.geneWithAcc}
          tubeColor={props.tubeColor}
          timehr={props.timehr}
        />
      )}
    </div>
  );
};
