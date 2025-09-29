import styles from "../../styles/Home.module.css";

export const LayoutDropdown = (props) => {
    function handleChange(event) {
        props.onSelectionChange(event.target.value);
    }

    return(
        <>
            <span className={styles.dropdownTitles}>Layouts: </span>
            <select value={props.selectedOption} onChange={handleChange}>
                <option value="basic">Basic</option>
                <option value="spaced">Larger</option>
            </select>
        </>
        
    )
}