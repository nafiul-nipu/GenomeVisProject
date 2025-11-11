import { useEffect, useRef } from "react";
import "./App.css";
import { SpeciesDropdown } from "./components/dropdowns/SpeciesDropdown";
import meta_data from "./data_info.json";
import type { DataInfoType } from "./types/data_types_interfaces";
import { ChromosomeDropdown } from "./components/dropdowns/ChromosomeDropdown";
import { GeneDropdown } from "./components/dropdowns/GeneDropdown";
import { ConditionTabs } from "./components/three-views/ConditionsTab";
import { useAppDispatch, useAppSelector } from "./redux-store/hooks";
import { fetchWorkerData } from "./redux-store/dataSlice";
import { terminateWorker } from "./worker/workerService";
import { ThreeDViewContainer } from "./components/three-views/ThreeDViewContainer";
import { TwoDContainer } from "./components/twoD-views/TwoDContainer";
import { TwoDControls } from "./components/twoD-views/TwoDControls";

const meta_data_typed = meta_data as DataInfoType;

export default function App() {
  const mount = useRef<boolean | null>(null);
  const dispatch = useAppDispatch();
  const { species, chromosome } = useAppSelector((s) => s.ui);
  const status = useAppSelector((s) => s.data.status);

  useEffect(() => {
    mount.current = true;

    console.log("[component] Dispatching fetchWorkerData...");
    dispatch(
      fetchWorkerData({ data_info: meta_data_typed, species, chromosome })
    )
      .unwrap()
      .then((res) => console.log("[component] Worker success:", res))
      .catch((err) => console.error("[component] Worker failed:", err));

    // dispatch(
    //   fetchWorkerData({ data_info: meta_data_typed, species, chromosome })
    // );

    return () => terminateWorker();
  }, []);

  useEffect(() => {
    if (!mount.current) return;

    console.log("[component] Dispatching fetchWorkerData...");
    dispatch(
      fetchWorkerData({ data_info: meta_data_typed, species, chromosome })
    )
      .unwrap()
      .then((res) => console.log("[component] Worker success:", res))
      .catch((err) => console.error("[component] Worker failed:", err));

    // dispatch(
    //   fetchWorkerData({ data_info: meta_data_typed, species, chromosome })
    // );
  }, [dispatch, species, chromosome]);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
      {/* NAV (top) */}
      {/* <header className="h-14 flex-shrink-0 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40"> */}
      <header className="relative z-50 h-14 flex-shrink-0 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40 overflow-visible">
        <div className="w-full px-4 h-full flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">GenomeVis</h1>
          <SpeciesDropdown meta_data={meta_data_typed} />
          <ChromosomeDropdown meta_data={meta_data_typed} />
          <GeneDropdown />
        </div>
      </header>

      {/* 3D PANEL */}
      <section className="flex-grow px-1 py-2 overflow-hidden min-h-0">
        <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/40 p-3 shadow-inner flex flex-col min-h-0">
          <div className="mb-2">
            <ConditionTabs meta_data_typed={meta_data_typed} />
          </div>

          <div className="flex-1 rounded-xl bg-gray-800/40 relative overflow-hidden min-h-0">
            {status === "loading" ? (
              <span className="text-sm text-sky-400 animate-pulse">
                Loading 3D data…
              </span>
            ) : status === "failed" ? (
              <span className="text-sm text-red-400">
                Worker error loading data
              </span>
            ) : (
              <ThreeDViewContainer meta_data_typed={meta_data_typed} />
            )}
          </div>
        </div>
      </section>

      {/* 2D PANEL */}
      <section className="h-[45%] px-1 pb-2 overflow-hidden">
        <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/40 p-3 shadow-inner flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">2D View</h2>
            <TwoDControls />
          </div>
          <div className="flex-1 rounded-xl bg-gray-800/40 grid place-items-center">
            {status === "loading" ? (
              <span className="text-sm text-sky-400 animate-pulse">
                Loading silhouettes / densities…
              </span>
            ) : (
              <span className="text-sm text-gray-400">
                <TwoDContainer meta_data_typed={meta_data_typed} />
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
