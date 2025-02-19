import { InputNumber, Row, Slider, Col, Switch, Select } from "antd";
import React from "react";

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

  function handleToggleChange(checked) {
    // console.log(event.target.checked);
    props.setGeneWithAcc(checked);
  }

  function handleTubeColorChange(value) {
    props.setTubeColor(value);
  }

  return (
    <Col span={18}>
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
          <Select
            value={props.tubeColor}
            onChange={(value) => handleTubeColorChange(value)}
            // style={{ width: 120 }}
          >
            <Select.Option value="none">None</Select.Option>
            <Select.Option value="centromere">Cent</Select.Option>
            <Select.Option value="compartment">Comp</Select.Option>
          </Select>
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
    </Col>
  );
}
