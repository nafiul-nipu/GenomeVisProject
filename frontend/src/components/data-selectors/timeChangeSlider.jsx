import { Col, Flex, Row, Select, Slider } from "antd";

const marks = {
  12: "12hrs",
  18: "18hrs",
  24: "24hrs",
};
export const TimeChangeSlider = (props) => {
  return (
    // <Col span={8}>
    //   <Row>
    //     <Col span={4}>Time: </Col>
    //     <Col span={20}>
    //       <Slider
    //         marks={marks}
    //         step={6}
    //         defaultValue={props.timehr}
    //         onChange={(value) => props.setTimehr(`${value}hrs`)}
    //         min={12}
    //         max={24}
    //       />
    //     </Col>
    //   </Row>
    // </Col>
    <Col span={8}>
      <Flex>
        <span>Time: </span>
        <Select
          value={props.timehr}
          onChange={(value) => props.setTimehr(value)}
          options={[
            { value: "12hrs", label: "12hrs" },
            { value: "18hrs", label: "18hrs" },
            { value: "24hrs", label: "24hrs" },
          ]}
        />
      </Flex>
    </Col>
  );
};
