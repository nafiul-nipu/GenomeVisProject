import { useRef } from "react";
import { useAppDispatch } from "../redux-store/hooks";
import { setExternalData } from "../redux-store/dataSlice";
import type {
  DataSetupWizardProps,
  DataInfoType,
} from "../types/data_types_interfaces";

export function DataSetupWizard({
  onCancel,
  onComplete,
}: DataSetupWizardProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.meta || !parsed.data) {
        alert("Invalid file: missing meta or data");
        return;
      }

      dispatch(setExternalData(parsed.data));
      onComplete(parsed.meta as DataInfoType);
    } catch (err) {
      console.error(err);
      alert("Failed to load file");
    }
  };

  return (
    <div className="w-full h-screen grid place-items-center bg-black text-white">
      <div className="text-center space-y-5 max-w-md w-full px-6">
        <h2 className="text-2xl font-semibold">Load your data</h2>

        <p className="text-gray-400 text-sm">
          Upload a single <span className="text-gray-200">JSON bundle</span>{" "}
          containing precomputed results. GenomeVis will visualize the data (it
          does not run MPASE).
        </p>

        {/* Clickable upload card */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border border-gray-700 bg-gray-900/60
                     hover:bg-gray-800/60 hover:border-gray-500
                     transition px-5 py-6 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
              <span className="text-sky-300 text-lg">⬆</span>
            </div>

            <div className="flex-1">
              <div className="text-white font-medium">
                Click to choose a JSON file
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Expected:{" "}
                <span className="text-gray-300">genomevis_bundle.json</span>
              </div>
            </div>
          </div>
        </button>

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = ""; // allow re-uploading same file
          }}
        />

        <div className="text-xs text-gray-500">
          File must contain:{" "}
          <span className="text-gray-300">{"{ meta, data }"}</span>
        </div>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                     text-sm text-gray-200 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
}
