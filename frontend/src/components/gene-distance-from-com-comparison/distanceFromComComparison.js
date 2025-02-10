import * as d3 from "d3";
import { useState } from "react";
import styles from "../../styles/Home.module.css";
import { Grid } from "@nextui-org/react";
import { getInnerMiddleOuterRanges } from "../../utilities/getInnetMiddleOuterRanges";
import { getInnerMiddelOuterGroups } from "../../utilities/getInnerMiddleOuterGroups";
import { innerMiddleOuterAdjacencyMatrix } from "../../utilities/innerMiddleOuterAdjacencyMatrix";
import { ChordLinkDiagram } from "./chord-link-diagram";
import RectanglesVisualization from "./compare-groups-before-after";
import { GeneMovementViewer } from "./gene-movement";

import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";

export const DistFromCOMCoparison = ({
  data,
  setChordSelection,
  chordClicked,
  setChordClicked,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // console.log(data);
  const beforeExtent = d3.extent(
    data.before_data.gene_data,
    (d) => d.distance_from_com
  );
  // console.log(beforeExtent);

  const afterExtent = d3.extent(
    data.after_data.gene_data,
    (d) => d.distance_from_com
  );
  // console.log(afterExtent);

  const maxVal = d3.max([...beforeExtent, ...afterExtent]);
  // console.log(maxVal);

  const beforeGroupRanges = getInnerMiddleOuterRanges(beforeExtent[1]);
  const afterGroupRanges = getInnerMiddleOuterRanges(afterExtent[1]);

  // console.log(beforeGroupRanges, afterGroupRanges);

  const beforeGroupData = getInnerMiddelOuterGroups(
    data.before_data.gene_data,
    beforeGroupRanges
  );
  const afterGroupData = getInnerMiddelOuterGroups(
    data.after_data.gene_data,
    afterGroupRanges
  );

  // console.log(beforeGroupData);
  // console.log(afterGroupData);

  // Call the function to create adjacency matrix
  let resultMatrix = innerMiddleOuterAdjacencyMatrix(
    beforeGroupData,
    afterGroupData
  );
  // console.log(resultMatrix);

  const chordData = Object.assign(resultMatrix, {
    names: ["inner", "middle", "outer"],
    colors: ["#ffdd89", "#957244", "#f26223"],
  });

  return (
    <>
      <Grid xs={4} className={styles.bottomView}>
        <span style={{ position: "absolute", bottom: "28%" }}>
          Inner-Middle-Outer Transition Before to After
          <Button icon={<FullscreenOutlined />} onClick={showModal} />
        </span>
        <ChordLinkDiagram
          data={chordData}
          setChordSelection={setChordSelection}
          before={beforeGroupData}
          after={afterGroupData}
          chordClicked={chordClicked}
          setChordClicked={setChordClicked}
        />
      </Grid>
      <Grid xs={4}>
        <span style={{ position: "absolute" }}>Gene Count Before After</span>
        <RectanglesVisualization
          dataset1={beforeGroupData}
          dataset2={afterGroupData}
          datalength={data.before_data.gene_data.length}
        />
      </Grid>
      {/* <Grid xs={4}>
        <GeneMovementViewer
          before={beforeGroupData}
          after={afterGroupData}
          chordData={chordData}
        />
      </Grid> */}

      <Modal
        title="Detailed Gene Movement"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
        width={(80 * window.innerHeight) / 100}
      >
        {isModalOpen ? (
          <GeneMovementViewer
            before={beforeGroupData}
            after={afterGroupData}
            chordData={chordData}
          />
        ) : null}
      </Modal>
    </>
  );
};
