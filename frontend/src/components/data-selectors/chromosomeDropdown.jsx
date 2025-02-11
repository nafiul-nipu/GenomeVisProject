import { Col, Select } from "antd";

export const ChromosomeDropdown = (props) => {
  function handleChange(value) {
    props.onSelectionChange(value);
  }
  // console.log(props.data)

  return (
    <Col>
      <span>Chrms: </span>
      <Select
        value={props.selectedOption}
        onChange={(value) => handleChange(value)}
        // style={{ width: 120 }}
        options={props.data.map((d) => ({ value: d, label: d }))}
      />
    </Col>
  );
};
