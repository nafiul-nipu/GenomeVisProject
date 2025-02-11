import { Col, Flex, Select } from "antd";
import "../../App.css";
export const SpeciesDropdown = ({
  selectedOption,
  onSelectionChange,
  data,
  setChromosome,
  meta_data,
}) => {
  function handleChange(value) {
    const sp = value;

    onSelectionChange(sp);
    setChromosome(meta_data[sp].chromosomes[0]);
  }

  return (
    <Col span={2} className="dropdowns">
      <Flex>
        <span className="dropdownTitles">Cell Type: </span>
        <Select
          value={selectedOption}
          onChange={(value) => handleChange(value)}
          // style={{ width: 80 }}
          options={data.map((d) => ({ value: d, label: d }))}
        />
      </Flex>
    </Col>
  );
};
