import { useState } from "react";
import "./App.css";

import type { AppMode, DataInfoType } from "./types/data_types_interfaces";
import dataInfoDefault from "./data_info.json";

import { VisualizationRoot } from "./Route/VisualizationRoot";
import { LandingScreen } from "./Route/LandingScreen";
import { DataSetupWizard } from "./Route/DataSetupWizard";

function App() {
  const [mode, setMode] = useState<AppMode>("landing");
  const [dataInfo, setDataInfo] = useState<DataInfoType | null>(null);

  return (
    <div className="w-full h-full">
      {mode === "landing" && (
        <LandingScreen
          onUseDemo={() => {
            setDataInfo(dataInfoDefault as DataInfoType);
            setMode("visualization");
          }}
          onLoadUserData={() => setMode("setup")}
        />
      )}

      {mode === "setup" && (
        <DataSetupWizard
          onCancel={() => setMode("landing")}
          onComplete={(config) => {
            setDataInfo(config);
            setMode("visualization");
          }}
        />
      )}

      {mode === "visualization" && dataInfo && (
        <VisualizationRoot meta_data_typed={dataInfo} />
      )}
    </div>
  );
}

export default App;
