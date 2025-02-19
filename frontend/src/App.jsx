import React, { useEffect, useRef, useState } from "react";
import { Col, Layout, Menu, Row } from "antd";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import meta_data from "./meta.json";
import { message_to_client } from "./worker-handler/messageToClient";
import { message_to_worker } from "./worker-handler/messagetoWorker";
import { SpeciesDropdown } from "./components/data-selectors/speciesDropdown";
import { ChromosomeDropdown } from "./components/data-selectors/chromosomeDropdown";
import { GeneDropdown } from "./components/data-selectors/geneDropdown";
import { FilterById } from "./components/data-selectors/filter-by-id";
import { AccessibilityRangeSlider } from "./components/data-selectors/accessibility-range-slider";
import RadiusSliders from "./components/data-selectors/radius-sliders";
import { ContentContainer } from "./components/containers/ContentContainer";
import { DistFromCOMCoparison } from "./components/gene-distance-from-com-comparison/distanceFromComComparison";
const { Header, Content, Footer, Sider } = Layout;
import "./App.css";

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}
const items = [
  getItem("Option 1", "1", <PieChartOutlined />),
  getItem("Option 2", "2", <DesktopOutlined />),
  getItem("User", "sub1", <UserOutlined />, [
    getItem("Tom", "3"),
    getItem("Bill", "4"),
    getItem("Alex", "5"),
  ]),
  getItem("Team", "sub2", <TeamOutlined />, [
    getItem("Team 1", "6"),
    getItem("Team 2", "8"),
  ]),
  getItem("Files", "9", <FileOutlined />),
];

const App = () => {
  const mount = useRef();

  // worker ref
  const workerRef = {
    "get-data": useRef(),
  };

  const [collapsed, setCollapsed] = useState(false);

  const [gene_name, setGeneName] = useState("All");
  const [data, setData] = useState(null);
  const [species, setSpecies] = useState("monkey");
  const [chromosome, setChromosome] = useState("chr1");
  const [timehr, setTimehr] = useState("12hrs");

  const [toggleGene, setToggleGene] = useState(false);
  const [geneWithAcc, setGeneWithAcc] = useState(false);

  // sliders
  const [atomSlider, setAtomSlider] = useState(1);
  const [geneSlider, setGeneSlider] = useState(1);
  const [tubeSlider, setTubeSlider] = useState(0.1);
  const [accSlider, setAccSlider] = useState(0.5);

  const [accRange, setAccRange] = useState(null);
  const [chrRange, setChrRange] = useState(null);

  const [chordSelection, setChordSelection] = useState(null);
  const [chordClicked, setChordClicked] = useState(null);

  const [tubeColor, setTubeColor] = useState("none");

  // mounting the app and create worker
  // mounting the app and create worker
  useEffect(() => {
    mount.current = true;

    // workerRef["get-data"].current = new Worker(
    //   new URL("./worker/data.worker.js", import.meta.url)
    // );

    workerRef["get-data"].current = new Worker(
      new URL("./worker/data.worker.js", import.meta.url),
      {
        type: "module",
      }
    );

    workerRef["get-data"].current.onmessage = (datamsg) => {
      message_to_client(datamsg, setData, setAccRange);
    };

    message_to_worker(
      workerRef["get-data"].current,
      species,
      chromosome,
      timehr,
      meta_data[species]
    );

    return () => {
      workerRef["get-data"].current.terminate();
      mount.current = false;
    };
  }, []);

  // on data change
  useEffect(() => {
    if (mount.current && species) {
      message_to_worker(
        workerRef["get-data"].current,
        species,
        chromosome,
        timehr,
        meta_data[species]
      );
    }
  }, [species, chromosome]);

  console.log(data);
  // console.log(accRange);

  return (
    <Layout>
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Menu defaultSelectedKeys={["1"]} mode="inline" items={items} />
      </Sider>

      <Layout className="viewContainer">
        <Row>
          <SpeciesDropdown
            selectedOption={species}
            onSelectionChange={setSpecies}
            data={Object.keys(meta_data)}
            setChromosome={setChromosome}
            meta_data={meta_data}
          />
          <ChromosomeDropdown
            selectedOption={chromosome}
            onSelectionChange={setChromosome}
            data={meta_data[species].chromosomes}
          />
          {data && (
            <GeneDropdown
              toggleGene={toggleGene}
              changeToggleGene={setToggleGene}
              data={data.before_data.genes}
              setGeneName={setGeneName}
              setAtomSlider={setAtomSlider}
              setGeneSlider={setGeneSlider}
              setTubeSlider={setTubeSlider}
              setChordSelection={setChordSelection}
              setChordClicked={setChordClicked}
              setAccSlider={setAccSlider}
            />
          )}
          {data && (
            <FilterById
              maxVal={data.before_data.atom_data.nodes.length}
              setChrRange={setChrRange}
              resolution={meta_data[species].resolution}
            />
          )}
          {accRange && (
            <AccessibilityRangeSlider
              minVal={data.before_data.accessibility.domain_min}
              maxVal={data.before_data.accessibility.domain_max}
              accRange={accRange}
              setAccRange={setAccRange}
            />
          )}
        </Row>
        <Row>
          <RadiusSliders
            atomSlider={atomSlider}
            setAtomSlider={setAtomSlider}
            geneSlider={geneSlider}
            setGeneSlider={setGeneSlider}
            tubeSlider={tubeSlider}
            setTubeSlider={setTubeSlider}
            accSlider={accSlider}
            setAccSlider={setAccSlider}
            geneWithAcc={geneWithAcc}
            setGeneWithAcc={setGeneWithAcc}
            tubeColor={tubeColor}
            setTubeColor={setTubeColor}
          />
        </Row>
        <Row>
          <Col span={24}>
            <ContentContainer
              data={data}
              toggleGene={toggleGene}
              canvasID={"canvas1"}
              chromosome={chromosome}
              atomSlider={atomSlider}
              geneSlider={geneSlider}
              tubeSlider={tubeSlider}
              gene_name={gene_name}
              nodeStyles={"nodeDetails"}
              chordSelection={chordSelection}
              accSlider={accSlider}
              accRange={accRange}
              chrRange={chrRange}
              viewTitles={[
                `${chromosome}_${timehr}_${meta_data[species]["before-name"]}`,
                `${chromosome}_${timehr}_${meta_data[species]["after-name"]}`,
              ]}
              geneWithAcc={geneWithAcc}
              tubeColor={tubeColor}
            />
          </Col>
        </Row>
        <Row>
          {data && (
            <DistFromCOMCoparison
              data={data}
              setChordSelection={setChordSelection}
              chordClicked={chordClicked}
              setChordClicked={setChordClicked}
            />
          )}
        </Row>
      </Layout>
    </Layout>
  );
};
export default App;
