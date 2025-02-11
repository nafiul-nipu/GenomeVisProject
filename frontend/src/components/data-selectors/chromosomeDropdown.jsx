import { Col, Flex, Select } from "antd";
import "../../App.css";
export const ChromosomeDropdown = (props) => {
  function handleChange(value) {
    props.onSelectionChange(value);
  }
  // console.log(props.data)

  return (
    <Col span={2} className="dropdowns">
      <Flex>
        <span className="dropdownTitles">Chrms: </span>
        <Select
          value={props.selectedOption}
          onChange={(value) => handleChange(value)}
          // style={{ width: 120 }}
          options={props.data.map((d) => ({ value: d, label: d }))}
        />
      </Flex>
    </Col>
  );
};
