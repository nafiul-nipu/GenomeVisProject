import { Col, Switch, Button, AutoComplete, Flex } from "antd";
import "../../App.css";

export const GeneDropdown = (props) => {
  function handleToggleChange(checked) {
    // console.log(checked);
    props.changeToggleGene(checked);
  }
  // console.log(props.data)

  function resetGeneDropDown() {
    console.log("resetting gene dropdown");
    props.setGeneName("All");
    props.changeToggleGene(false);
    props.setAtomSlider(0);
    props.setGeneSlider(0.5);
    props.setTubeSlider(0.02);
    props.setChordSelection(null);
    props.setChordClicked(null);
    props.setAccSlider(0);
  }

  function handleSelect(value) {
    props.setGeneName(value);
  }

  function handleClear() {
    props.setGeneName("All");
  }

  return (
    <Col span={6} className="dropdowns">
      <Flex>
        <span className="dropdownTitles">Genes: </span>
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
      </Flex>
    </Col>
  );
};
