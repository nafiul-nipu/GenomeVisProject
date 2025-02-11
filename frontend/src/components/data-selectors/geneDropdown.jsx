import { Col, Switch, Button, AutoComplete } from "antd";

export const GeneDropdown = (props) => {
  function handleToggleChange(checked) {
    // console.log(checked);
    props.changeToggleGene(checked);
  }
  // console.log(props.data)

  function resetGeneDropDown() {
    props.setGeneName("All");
    props.changeToggleGene(false);
    props.setAtomSlider(1);
    props.setGeneSlider(1);
    props.setTubeSlider(0.1);
    props.setChordSelection(null);
    props.setChordClicked(null);
    props.setAccSlider(0.5);
  }

  function handleSelect(value) {
    props.setGeneName(value);
  }

  function handleClear() {
    props.setGeneName("All");
  }

  return (
    <Col>
      <span>Genes: </span>
      <AutoComplete
        style={{ width: 200 }}
        options={props.data}
        placeholder="Type Gene Name"
        filterOption={(inputValue, option) =>
          option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        allowClear={true}
        onSelect={handleSelect}
        onClear={handleClear}
      />
      <span>See Genes: </span>
      <Switch
        onChange={handleToggleChange}
        checked={props.toggleGene}
        color="primary"
      />
      <Button onClick={resetGeneDropDown}>Reset</Button>
    </Col>
  );
};
