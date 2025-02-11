import { Col, Select } from "antd";
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
    <Col>
      <span>Cell Type: </span>
      <Select
        value={selectedOption}
        onChange={(value) => handleChange(value)}
        // style={{ width: 120 }}
        options={data.map((d) => ({ value: d, label: d }))}
      />
    </Col>
  );
};
