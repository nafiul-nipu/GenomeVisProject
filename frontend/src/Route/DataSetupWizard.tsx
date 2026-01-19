import type { DataSetupWizardProps } from "../types/data_types_interfaces";

export function DataSetupWizard({ onCancel }: DataSetupWizardProps) {
  return (
    <div className="w-full h-screen grid place-items-center bg-black">
      <div className="text-center space-y-4">
        <h2 className="text-xl text-white">Load Your Data (Coming Next)</h2>

        <p className="text-gray-400 max-w-md">
          Here we will guide users to upload files, validate formats, and
          generate the required configuration.
        </p>

        <button
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
        >
          Back
        </button>
      </div>
    </div>
  );
}
