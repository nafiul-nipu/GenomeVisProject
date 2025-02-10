import styles from "../../styles/Home.module.css";
import { InputNumber, Row, Slider, Col } from "antd";
import { Switch } from "@nextui-org/react";
import React from "react";

// radius slider component that is wrapped in the radius wrapper
// to fix the useLayoutEffect warning in React
// when working with antD and nextjs due
// to ssr issue
export default function RadiusSliders(props) {
  // console.log(props);

  const onAtomSliderChange = (newVal) => {
    props.setAtomSlider(newVal);
  };

  const onGeneSliderChange = (newVal) => {
    props.setGeneSlider(newVal);
  };

  const onTubeSliderChange = (newVal) => {
    props.setTubeSlider(newVal);
  };

  const onAccSliderChange = (newVal) => {
    props.setAccSlider(newVal);
  };

  function handleToggleChange(event) {
    // console.log(event.target.checked);
    props.setGeneWithAcc(event.target.checked);
  }

  function handleTubeColorChange(event) {
    props.setTubeColor(event.target.value);
  }

  return (
    <Row>
      <Col span={1}>Bead: </Col>
      <Col span={2}>
        <Slider
          min={0}
          max={2}
          step={0.1}
          onChange={onAtomSliderChange}
          value={typeof props.atomSlider === "number" ? props.atomSlider : 0}
        />
      </Col>
      <Col span={1}>
        <InputNumber
          min={0}
          max={2}
          step={0.1}
          value={props.atomSlider}
          onChange={onAtomSliderChange}
          style={{ width: "94%" }}
        />
      </Col>

      <Col span={1}>Gene: </Col>
      <Col span={2}>
        <Slider
          min={0}
          max={2}
          step={0.1}
          onChange={onGeneSliderChange}
          value={typeof props.geneSlider === "number" ? props.geneSlider : 0}
        />
      </Col>
      <Col span={1}>
        <InputNumber
          min={0}
          max={2}
          step={0.1}
          value={props.geneSlider}
          onChange={onGeneSliderChange}
          style={{ width: "94%" }}
        />
      </Col>

      <Col span={1}>Tube: </Col>
      <Col span={2}>
        <Slider
          min={0}
          max={0.7}
          step={0.1}
          onChange={onTubeSliderChange}
          value={typeof props.tubeSlider === "number" ? props.tubeSlider : 0}
        />
      </Col>
      <Col span={2}>
        <InputNumber
          min={0}
          max={0.7}
          step={0.1}
          value={props.tubeSlider}
          onChange={onTubeSliderChange}
          style={{ width: "94%" }}
        />
      </Col>
      <Col span={1}>Color: </Col>
      <Col span={2}>
        <select value={props.tubeColor} onChange={handleTubeColorChange}>
          <option value="none">None</option>
          <option value="centromere">Cent</option>
          <option value="compartment">Comp</option>
        </select>
      </Col>
      <Col span={1}>Acc: </Col>
      <Col span={2}>
        <Slider
          min={0}
          max={2}
          step={0.1}
          onChange={onAccSliderChange}
          value={typeof props.accSlider === "number" ? props.accSlider : 0}
        />
      </Col>
      <Col span={2}>
        <InputNumber
          min={0}
          max={2}
          step={0.1}
          value={props.accSlider}
          onChange={onAccSliderChange}
          style={{ width: "94%" }}
        />
      </Col>
      <Col span={2}> Gene W Acc:</Col>
      <Col span={1}>
        <Switch
          onChange={handleToggleChange}
          checked={props.geneWithAcc}
          color="primary"
        />
      </Col>
    </Row>
  );
}
