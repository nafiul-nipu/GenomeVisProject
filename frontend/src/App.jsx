import React, { useEffect, useRef, useState } from "react";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import meta_data from "./meta.json";
import { message_to_client } from "./worker-handler/messageToClient";
import { message_to_worker } from "./worker-handler/messagetoWorker";
const { Header, Content, Footer } = Layout;

const App = () => {
  const mount = useRef();

  // worker ref
  const workerRef = {
    "get-data": useRef(),
  };

  const [gene_name, setGeneName] = useState("All");
  const [data, setData] = useState(null);
  const [species, setSpecies] = useState("MRC5");
  const [chromosome, setChromosome] = useState("chr10");

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
        meta_data[species]
      );
    }
  }, [species, chromosome]);

  console.log(data);
  console.log(accRange);

  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          color: "black",
          backgroundColor: "white",
          height: "5vh",
        }}
      >
        Navigation Panel
      </Header>
      <Content>
        <div
          style={{
            width: "100vw",
            height: "90vh",
          }}
        >
          content
        </div>
      </Content>
    </Layout>
  );
};
export default App;
