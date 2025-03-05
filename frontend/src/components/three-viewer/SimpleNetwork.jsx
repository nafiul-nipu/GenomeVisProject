import { Canvas, useThree } from "@react-three/fiber";
import "../../App.css";
import React from "react";

import {
  AdaptiveDpr,
  AdaptiveEvents,
  Stats,
  OrbitControls,
  Bounds,
  View,
  PerspectiveCamera,
  Center,
} from "@react-three/drei";
import { useControls } from "leva";

import NodeRenderer from "./instanced-rendering/instanced-node-renderer";
import InstancedTubeRendererFromPathMaterial from "./instanced-rendering/intanced-tube-from-path-with-material-controls";
import { useMemo, useRef, useState } from "react";
import GeneSphereRenderer from "./instanced-rendering/instanced-gene-renderer";
import { NodeDetails } from "../node-details/nodeDetails";
import AccSpehereRenderer from "./instanced-rendering/instanced-access-renderer";
import ColorLegend from "./ColorLegend";
import GeneSphereRendererWithOpacity from "./instanced-rendering/instanced-gene-renderer-with-opacity";
import AccSpehereRendererWithOpacity from "./instanced-rendering/instanced-access-renderer-with-opcaity";
import { DrawGeneWithAcc } from "./instanced-rendering/gene-with-access-tube";
import { GeneAccWithTubeRenderer } from "./instanced-rendering/instanced-gene-acc-tube";

const currChromosome = "chr01";

const SimpleNetwork = (props) => {
  const viewContainerRef = useRef();
  const views = [useRef(), useRef()];

  const [viewChanged, setViewChanged] = useState(true);
  const [lineViewChanged, setLineViewChanged] = useState(true);

  const [nodeDetails, setNodeDetails] = useState(null);

  const viewHeight = useMemo(() => {
    return (60 * window.innerHeight) / 100;
  }, [window.innerHeight]);

  const rotationCtl = useControls(
    "Rotate View2",
    {
      rotateX: {
        value: 0,
        min: 0,
        max: 6,
        step: 0.1,
      },
      rotateY: {
        value: 0,
        min: 0,
        max: 6,
        step: 0.1,
      },
      rotateZ: {
        value: 0,
        min: 0,
        max: 6,
        step: 0.1,
      },
    },
    { collapsed: true }
  );

  // light controls
  const ambientCtl = useControls(
    "Ambient Light",
    {
      visible: true,
      intensity: {
        value: 0.5,
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    },
    { collapsed: true }
  );

  const directionalFrontCtl = useControls(
    "Directional Light Front",
    {
      visible: true,
      position: {
        x: 3.3,
        y: 1.0,
        z: 4.4,
      },
      intensity: {
        value: 0.4, // Reduced intensity for balanced lighting
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      castShadow: true, // Enable shadows if needed
    },
    { collapsed: true }
  );

  const directionalBackCtl = useControls(
    "Directional Light Back",
    {
      visible: true,
      position: {
        x: -3.3,
        y: -1.0,
        z: -4.4,
      },
      intensity: {
        value: 0.4, // Reduced intensity for balanced lighting
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      castShadow: true, // Enable shadows if needed
    },
    { collapsed: true }
  );

  const directionalLeftCtl = useControls(
    "Directional Light Left",
    {
      visible: true,
      position: {
        x: -5.0,
        y: 5.0,
        z: 5.0,
      },
      intensity: {
        value: 0.4, // Reduced intensity for balanced lighting
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      castShadow: true, // Enable shadows if needed
    },
    { collapsed: true }
  );

  const directionalRightCtl = useControls(
    "Directional Light Right",
    {
      visible: true,
      position: {
        x: 5.0,
        y: 5.0,
        z: 5.0,
      },
      intensity: {
        value: 0.4, // Reduced intensity for balanced lighting
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      castShadow: true, // Enable shadows if needed
    },
    { collapsed: true }
  );

  // Get the control values
  const nodeCtl = useControls(
    "Node",
    {
      emissive: "#000000", // Initial emissive value
      specular: "#621616", // Initial specular value
      shininess: 5, // Initial shininess value
    },
    { collapsed: true }
  );

  // Get the control values
  const edgectl = useControls(
    "Edges",
    {
      color: "#E6E6FA", // Initial color value
      emissive: "#000000", // Initial emissive value
      specular: "#ffffff", // Initial specular value
      shininess: 5, // Initial shininess value
    },
    { collapsed: true }
  );

  return (
    <>
      <div ref={viewContainerRef} className="canvasViewContainer">
        <div className="colorLegendAcc">
          <ColorLegend
            percentile10={props.data.before_data.accessibility.percentile10}
            percentile90={props.data.before_data.accessibility.percentile90}
            min={props.data.before_data.accessibility.domain_min}
            max={props.data.before_data.accessibility.domain_max}
          />
        </div>
        {Object.keys(props.data).map((item, index) => (
          <div key={index} className={`${item}Title`}>
            {props.viewTitles[index]}
          </div>
        ))}
        {Object.keys(props.data).map((item, index) => (
          <div
            key={index}
            ref={views[index]}
            style={{
              height: viewHeight,
              width: window.innerWidth / Object.keys(props.data).length - 10,
              display: "inline-block",
              padding: "2px",
              margin: "2px",
            }}
            id={item}
          ></div>
        ))}
        <Canvas
          eventSource={viewContainerRef}
          className="canvas"
          frameloop="demand"
          performance={{ min: 0.4 }}
          id={props.canvasID}
          camera={{ position: [10, 5, 75], near: 0.1 }}
        >
          {Object.keys(props.data).map((item, index) => (
            <View key={index} index={index} track={views[index]}>
              <color attach="background" args={["#A9A9A9"]} />
              <Lights
                ambientCtl={ambientCtl}
                directionalCtl={directionalFrontCtl}
                directionalCtl2={directionalBackCtl}
                directionalLeftCtl={directionalLeftCtl}
                directionalRightCtl={directionalRightCtl}
              />
              <DrawObjects
                data={props.data[item]}
                tubeSlider={props.tubeSlider}
                edgectl={edgectl}
                toggleGene={props.toggleGene}
                geneSlider={props.geneSlider}
                geneName={props.geneName}
                setNodeDetails={setNodeDetails}
                nodeDetails={nodeDetails}
                nodeCtl={nodeCtl}
                item={item}
                chromosome={props.chromosome}
                atomSlider={props.atomSlider}
                viewChanged={viewChanged}
                setViewChanged={setViewChanged}
                chordSelection={props.chordSelection}
                accSlider={props.accSlider}
                accRange={props.accRange}
                rotationCtl={rotationCtl}
                chrRange={props.chrRange}
                tubeColor={props.tubeColor}
                geneWithAccView={props.geneWithAcc}
              />

              <OrbitControls
                makeDefault
                enableDamping={false}
                regress
                enablePan={true}
                enableZoom={true}
              />
              {/* cuts the pixel-ratio on regress according to the canvas's performance */}
              <AdaptiveDpr pixelated />
              <AdaptiveEvents />
            </View>
          ))}
          {/* <Stats /> */}
        </Canvas>
      </div>

      {Object.keys(props.data).map((item, index) => {
        return (
          <React.Fragment key={index}>
            {nodeDetails && (
              <NodeDetails
                key={index}
                data={props.data[item].atom_data}
                nodeStyles={`nodeDetails`}
                node={nodeDetails}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default SimpleNetwork;

const Lights = ({
  ambientCtl,
  directionalCtl,
  directionalCtl2,
  directionalLeftCtl,
  directionalRightCtl,
}) => {
  return (
    <>
      <ambientLight
        visible={ambientCtl.visible}
        intensity={ambientCtl.intensity}
      />
      <directionalLight
        visible={directionalCtl.visible}
        position={[
          directionalCtl.position.x,
          directionalCtl.position.y,
          directionalCtl.position.z,
        ]}
        castShadow={directionalCtl.castShadow}
        intensity={directionalCtl.intensity}
      />

      <directionalLight
        visible={directionalCtl2.visible}
        position={[
          directionalCtl2.position.x,
          directionalCtl2.position.y,
          directionalCtl2.position.z,
        ]}
        castShadow={directionalCtl2.castShadow}
        intensity={directionalCtl2.intensity}
      />
      {/* New left directional light */}
      <directionalLight
        visible={directionalLeftCtl.visible}
        position={[
          directionalLeftCtl.position.x,
          directionalLeftCtl.position.y,
          directionalLeftCtl.position.z,
        ]}
        castShadow={directionalLeftCtl.castShadow}
        intensity={directionalLeftCtl.intensity}
      />

      {/* New right directional light */}
      <directionalLight
        visible={directionalRightCtl.visible}
        position={[
          directionalRightCtl.position.x,
          directionalRightCtl.position.y,
          directionalRightCtl.position.z,
        ]}
        castShadow={directionalRightCtl.castShadow}
        intensity={directionalRightCtl.intensity}
      />
    </>
  );
};

const DrawObjects = ({
  data,
  tubeSlider,
  edgectl,
  toggleGene,
  geneSlider,
  geneName,
  setNodeDetails,
  nodeDetails,
  nodeCtl,
  item,
  chromosome,
  atomSlider,
  viewChanged,
  setViewChanged,
  chordSelection,
  accSlider,
  accRange,
  rotationCtl,
  chrRange,
  tubeColor,
  geneWithAccView,
}) => {
  const margin = 0;

  const viewport = useThree((state) => state.viewport);

  // console.log(item);

  return (
    <Center
      onCentered={({ container, height, width }) => {
        if (viewChanged) {
          container.scale.setScalar(viewport.width / width - margin);
          container.scale.setScalar(viewport.height / height - margin);
          setViewChanged(false);
        }
      }}
    >
      <group
        rotation={
          item === "after_data"
            ? [rotationCtl.rotateX, rotationCtl.rotateY, rotationCtl.rotateZ]
            : [0, 0, 0]
        }
      >
        <InstancedTubeRendererFromPathMaterial
          edges={data.atom_data.edges}
          paths={data.atom_data.paths}
          nodes={data.atom_data.nodes}
          radius={tubeSlider}
          edgectl={edgectl}
          toggleGene={toggleGene}
          tubeColor={tubeColor}
        />

        <GeneSphereRenderer
          gene_data={data.gene_data}
          geneSlider={geneSlider}
          geneName={geneName}
          chordSelection={chordSelection}
          chrRange={chrRange}
        />

        <GeneSphereRendererWithOpacity
          gene_data={data.gene_data}
          geneSlider={geneSlider}
          geneName={geneName}
          chordSelection={chordSelection}
          chrRange={chrRange}
        />

        {data.accessibility?.data !== undefined && (
          <AccSpehereRenderer
            acc_data={data.accessibility.data}
            min={data.accessibility.min}
            max={data.accessibility.max}
            domain_min={data.accessibility.domain_min}
            domain_max={data.accessibility.domain_max}
            percentile10={data.accessibility.percentile10}
            percentile90={data.accessibility.percentile90}
            accSlider={accSlider}
            accRange={accRange}
            chrRange={chrRange}
          />
        )}

        {data.accessibility?.data !== undefined && (
          <AccSpehereRendererWithOpacity
            acc_data={data.accessibility.data}
            min={data.accessibility.min}
            max={data.accessibility.max}
            domain_min={data.accessibility.domain_min}
            domain_max={data.accessibility.domain_max}
            percentile10={data.accessibility.percentile10}
            percentile90={data.accessibility.percentile90}
            accSlider={accSlider}
            accRange={accRange}
            chrRange={chrRange}
          />
        )}

        {geneWithAccView === true && (
          <GeneAccWithTubeRenderer
            data={data.gene_with_acc}
            radius={tubeSlider}
            edgectl={edgectl}
            percentile10={data.accessibility.percentile10}
            percentile90={data.accessibility.percentile90}
            accRange={accRange}
          />
          // <GeneWithAccCylinderRenderer data={data.gene_with_acc} />
        )}

        <NodeRenderer
          nodes={data.atom_data.nodes}
          edges={data.atom_data.edges}
          setNodeDetails={setNodeDetails}
          nodeDetails={nodeDetails}
          nodeCtl={nodeCtl}
          toggleGene={toggleGene}
          canvasID={item}
          chromosome={chromosome}
          atomSlider={atomSlider}
        />
      </group>
    </Center>
  );
};

const DrawGeneAccTube = ({
  data,
  edgectl,
  tubeSlider,
  item,
  rotationCtl,
  viewChanged,
  setViewChanged,
}) => {
  const margin = 0;
  const viewport = useThree((state) => state.viewport);
  return (
    <Center
      onCentered={({ container, height, width }) => {
        if (viewChanged) {
          console.log(
            container,
            viewport.width,
            viewport.height,
            width,
            height
          );
          container.scale.setScalar(viewport.width / 6.5);
          container.scale.setScalar(viewport.height / 4.5);
          setViewChanged(false);
        }
      }}
    >
      <group>
        <DrawGeneWithAcc data={data} />
      </group>
    </Center>
  );
};
