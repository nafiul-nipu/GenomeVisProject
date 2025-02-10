import styles from "../../styles/Home.module.css";
import { Grid } from "@nextui-org/react";

export const ChromosomeDropdown = (props) => {
  function handleChange(event) {
    props.onSelectionChange(event.target.value);
  }
  // console.log(props.data)

  return (
    <Grid.Container>
      <Grid xs={12} className={styles.chromosomeDropdownContainer}>
        <span className={styles.dropdownTitles}>Chrms: </span>
        <select value={props.selectedOption} onChange={handleChange}>
          {props.data
            ? props.data.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))
            : null}
        </select>
      </Grid>
    </Grid.Container>
  );
};
