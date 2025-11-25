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

import * as htmlToImage from "html-to-image";

const meta_data_typed = meta_data as DataInfoType;

export default function App() {
  const mount = useRef<boolean | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
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

  const handleExportPNG = async () => {
    const panelNode = exportRef.current;
    if (!panelNode) return;

    try {
      // Snapshot the whole app (nav + 3D + 2D)
      const pixelRatio = 2.5; // nice and crisp
      const panelDataUrl = await htmlToImage.toPng(panelNode, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#020617", // same as bg-gray-950, kills transparency
      });

      //Find the 3D canvas and snapshot it
      const threeRoot = document.getElementById("three-panel-root");
      const threeCanvas = threeRoot?.querySelector(
        "canvas"
      ) as HTMLCanvasElement | null;

      if (!threeRoot || !threeCanvas) {
        // Fallback: just download the HTML snapshot
        const link = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        link.download = `GenomeVis_panel_${species}_${chromosome}_${ts}.png`;
        link.href = panelDataUrl;
        link.click();
        return;
      }

      const threeDataUrl = threeCanvas.toDataURL("image/png");

      //Load both images
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const [panelImg, threeImg] = await Promise.all([
        loadImage(panelDataUrl),
        loadImage(threeDataUrl),
      ]);

      //Composite into one canvas
      const rectPanel = panelNode.getBoundingClientRect();
      const rectThree = threeCanvas.getBoundingClientRect();

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = panelImg.width;
      exportCanvas.height = panelImg.height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Solid background to ensure no transparency
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Scale factor from CSS px → exported image px
      const scaleX = exportCanvas.width / rectPanel.width;
      const scaleY = exportCanvas.height / rectPanel.height;
      const scale = (scaleX + scaleY) / 2;

      // Where the 3D canvas sits relative to the whole app
      const offsetX = (rectThree.left - rectPanel.left) * scale;
      const offsetY = (rectThree.top - rectPanel.top) * scale;
      const drawWidth = rectThree.width * scale;
      const drawHeight = rectThree.height * scale;

      // Draw HTML FIRST (nav + panels)
      ctx.drawImage(panelImg, 0, 0);

      // Then draw 3D screenshot ON TOP, just in its area
      ctx.drawImage(
        threeImg,
        0,
        0,
        threeImg.width,
        threeImg.height,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );

      // Export final PNG
      const finalUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `GenomeVis_panel_${species}_${chromosome}_${ts}.png`;
      link.href = finalUrl;
      link.click();
    } catch (err) {
      console.error("Export PNG failed:", err);
    }
  };

  return (
    <div
      ref={exportRef}
      className="w-screen h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden"
    >
      {/* NAV (top) */}
      {/* <header className="h-14 flex-shrink-0 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40"> */}
      <header className="relative z-50 h-14 flex-shrink-0 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40 overflow-visible">
        <div className="w-full px-4 h-full flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">GenomeVis</h1>
          <SpeciesDropdown meta_data={meta_data_typed} />
          <ChromosomeDropdown meta_data={meta_data_typed} />
          <GeneDropdown />
          {/* Screenshot button on the right */}
          <div className="ml-auto">
            <button
              onClick={handleExportPNG}
              className="text-xs px-3 py-1.5 rounded-md border border-sky-500/60 text-sky-200 hover:bg-sky-500/10 hover:border-sky-400 transition"
            >
              Export
            </button>
          </div>
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
            <h2 className="text-lg font-medium">Shape Analysis</h2>
            <TwoDControls />
          </div>
          <div className="flex-1 rounded-xl bg-gray-800/40 grid place-items-center">
            {status === "loading" ? (
              <span className="text-sm text-sky-400 animate-pulse">
                Loading shapes ...
              </span>
            ) : (
              <TwoDContainer meta_data_typed={meta_data_typed} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
