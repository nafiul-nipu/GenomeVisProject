import styles from "../../styles/Home.module.css";

const BeforeAfterSelection = (props) => {

    function handleChange(event) {
        props.onSelectionChange(event.target.value);
    }

    return (
        <>
            <span className={styles.dropdownTitles}>View: </span>
            <select value={props.selectedOption} onChange={handleChange}>
                <option value="before_url">Before</option>
                <option value="after_url">After</option>
                {/* <option value="genome_cell1">genome_cell1</option> */}
            </select>
        </>
    )
};

export default BeforeAfterSelection;