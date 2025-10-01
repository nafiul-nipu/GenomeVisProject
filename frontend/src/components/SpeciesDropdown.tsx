import React from "react";
import type { DataInfoType } from "../types/meta_data_types";
interface SpeciesDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
  setChromosome: (chr: string) => void;
  meta_data: DataInfoType;
}
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
        className="rounded-lg border border-gray-700 bg-gray-900 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
