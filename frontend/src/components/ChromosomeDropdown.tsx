import React from "react";
interface ChromosomeDropdownProps {
  selectedOption: string;
  onSelectionChange: (option: string) => void;
  data: string[];
}

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
