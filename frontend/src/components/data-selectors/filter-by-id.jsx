import { InputNumber, Button, Col } from "antd";
import { useState } from "react";

export const FilterById = (props) => {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(props.maxVal * props.resolution);

  const setButtonOnClick = () => {
    // console.log(from / props.resolution, to / props.resolution);
    const minRange = Math.round(from / props.resolution);
    const maxRange = Math.round(to / props.resolution);
    // console.log(minRange, maxRange);
    props.setChrRange([minRange, maxRange]);
  };
  return (
    <Col>
      <span>ChrID ({props.resolution / 1000}KB)</span>
      <InputNumber
        addonBefore="From"
        // addonAfter="KB"
        min={0}
        max={props.maxVal * props.resolution}
        value={from}
        onChange={(value) => setFrom(value)}
      />
      <InputNumber
        addonBefore="To"
        // addonAfter="KB"
        min={1 * props.resolution}
        max={props.maxVal * props.resolution}
        value={to}
        onChange={(value) => setTo(value)}
      />
      <Button onClick={setButtonOnClick}>Filter</Button>
    </Col>
  );
};
