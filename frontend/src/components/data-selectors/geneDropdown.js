import styles from "../../styles/Home.module.css";
import { Switch } from "@nextui-org/react/";
import { Button } from "antd";
import { AutoComplete } from "antd";
import { Grid } from "@nextui-org/react";

export const GeneDropdown = (props) => {
  function handleToggleChange(event) {
    // console.log(event.target.checked);
    props.changeToggleGene(event.target.checked);
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
    <Grid.Container>
      <Grid xs={12}>
        <span className={styles.dropdownTitles}>Genes: </span>
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
        <span className={styles.dropdownTitles}>See Genes: </span>
        <Switch
          onChange={handleToggleChange}
          checked={props.toggleGene}
          color="primary"
        />
        <Button onClick={resetGeneDropDown}>Reset</Button>
      </Grid>
    </Grid.Container>
  );
};
