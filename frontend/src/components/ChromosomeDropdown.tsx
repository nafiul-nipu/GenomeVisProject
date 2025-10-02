import React from "react";
import "../App.css";
import type { ChromosomeDropdownProps } from "../types/navigation_types";

export const ChromosomeDropdown: React.FC<ChromosomeDropdownProps> = ({
  selectedOption,
  onSelectionChange,
  data,
}) => {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onSelectionChange(value);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-200">Chrms: </span>
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
