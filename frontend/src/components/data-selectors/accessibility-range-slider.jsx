import { InputNumber, Slider, Row, Col, Button } from "antd";

export const AccessibilityRangeSlider = ({
  minVal,
  maxVal,
  accRange,
  setAccRange,
}) => {
  return (
    <Col>
      <span>Accessibility</span>
      <InputNumber
        min={minVal}
        max={maxVal}
        value={accRange[0]}
        onChange={(value) => setAccRange([value, accRange[1]])}
      />
      <Slider
        range={{ draggableTrack: true }}
        min={minVal}
        max={maxVal}
        defaultValue={[minVal, maxVal]}
        value={accRange}
        onChange={(value) => setAccRange(value)}
        style={{ width: "100%" }}
      />
      <InputNumber
        min={minVal}
        max={maxVal}
        value={accRange[1]}
        onChange={(value) => setAccRange([accRange[0], value])}
      />
    </Col>
  );
};
