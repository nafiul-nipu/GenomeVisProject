import React from "react";
import "../../App.css";
import type { ChromosomeDropdownProps } from "../../types/data_types_interfaces";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setChromosome } from "../../store/uiSlice";

export const ChromosomeDropdown: React.FC<ChromosomeDropdownProps> = ({
  meta_data,
}) => {
  const dispatch = useAppDispatch();
  const species = useAppSelector((s) => s.ui.species);
  const chromosome = useAppSelector((s) => s.ui.chromosome);

  const options = meta_data[species]?.chromosomes ?? [];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    dispatch(setChromosome(value));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-200">Chrms: </span>
      <select
        value={chromosome}
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
