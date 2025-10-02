import React from "react";
import "../App.css";
import type { SpeciesDropdownProps } from "../types/navigation_types";

export const SpeciesDropdown: React.FC<SpeciesDropdownProps> = ({
  selectedOption,
  onSelectionChange,
  data,
  setChromosome,
  meta_data,
}) => {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onSelectionChange(value);

    setChromosome(meta_data[value].chromosomes[0]);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-200">Species: </span>
      <select
        value={selectedOption}
        onChange={handleChange}
        className="dropdown-select"
      >
        {data.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
};
