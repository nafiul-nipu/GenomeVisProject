import { InputNumber, Slider, Row, Col, Button, Flex } from "antd";

export const AccessibilityRangeSlider = ({
  minVal,
  maxVal,
  accRange,
  setAccRange,
}) => {
  return (
    <Col span={8}>
      <Row>
        <Col span={4}>Accessibility</Col>
        <Col span={5}>
          <InputNumber
            min={minVal}
            max={maxVal}
            value={accRange[0]}
            onChange={(value) => setAccRange([value, accRange[1]])}
          />
        </Col>

        <Col span={10}>
          <Slider
            range={{ draggableTrack: true }}
            min={minVal}
            max={maxVal}
            defaultValue={[minVal, maxVal]}
            value={accRange}
            onChange={(value) => setAccRange(value)}
            style={{ width: "90%" }}
          />
        </Col>
        <Col span={5}>
          <InputNumber
            min={minVal}
            max={maxVal}
            value={accRange[1]}
            onChange={(value) => setAccRange([accRange[0], value])}
          />
        </Col>
      </Row>
    </Col>
  );
};
