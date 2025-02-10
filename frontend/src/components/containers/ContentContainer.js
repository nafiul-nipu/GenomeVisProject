import { Grid } from "@nextui-org/react";
import styles from "../../styles/Home.module.css";

import SimpleNetwork from "../network/SimpleNetwork";

export const ContentContainer = (props) => {
  return (
    <Grid.Container>
      <Grid xs={12}>
        <div className={styles.contentContainer}>
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
            />
          )}
        </div>
      </Grid>
    </Grid.Container>
  );
};
