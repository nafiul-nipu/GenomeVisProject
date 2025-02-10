import styles from "../../styles/Home.module.css";
import { Grid } from "@nextui-org/react";

const SpeciesDropdown = (props) => {
  function handleChange(event) {
    const sp = event.target.value;
    props.onSelectionChange(sp);
    props.setChromosome(props.meta_data[sp]["chromosomes"][0]);
  }

  return (
    <Grid.Container>
      <Grid xs={12}>
        <span className={styles.dropdownTitles}>Cell Type: </span>
        <select value={props.selectedOption} onChange={handleChange}>
          {props.data.map((d, i) => (
            <option key={i} value={d}>
              {d}
            </option>
          ))}

          {/* <option value="genome_cell1">genome_cell1</option> */}
        </select>
      </Grid>
    </Grid.Container>
  );
};

export default SpeciesDropdown;
