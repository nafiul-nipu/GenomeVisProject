import React from "react";
import "../../App.css";
import type { SpeciesDropdownProps } from "../../types/data_types_interfaces";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import { setChromosome, setSpecies } from "../../redux-store/uiSlice";

export const SpeciesDropdown: React.FC<SpeciesDropdownProps> = ({
  meta_data,
}) => {
  const dispatch = useAppDispatch();
  const species = useAppSelector((s) => s.ui.species);
  // const chromosome = useAppSelector((s) => s.ui.chromosome);

  const options = Object.keys(meta_data);
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    dispatch(setSpecies(value));
    dispatch(setChromosome(meta_data[value].chromosomes[0]));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-200">Species: </span>
      <select
        value={species}
        onChange={handleChange}
        className="dropdown-select"
      >
        {options.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
};
