import { useEffect, useRef, useState } from "react";
import "./App.css";
import { SpeciesDropdown } from "./components/SpeciesDropdown";
import meta_data from "./data_info.json";
import type { DataInfoType } from "./types/data_types_interfaces";
import { ChromosomeDropdown } from "./components/ChromosomeDropdown";
import { messageToClient } from "./worker/messageToClient";
import { messageToWorker } from "./worker/messageToWorker";

const meta_data_typed = meta_data as DataInfoType;

export default function App() {
  const mount = useRef<boolean | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [species, setSpecies] = useState<string>("green_monkey");
  const [chromosome, setChromosome] = useState<string>("chr1");

  const [test, setTest] = useState<unknown>(null);

  console.log(test);

  useEffect(() => {
    mount.current = true;

    workerRef.current = new Worker(
      new URL("./worker/data.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );

    workerRef.current.onmessage = (evt: MessageEvent) => {
      messageToClient(evt.data, setTest);
    };

    messageToWorker({
      workerRef: workerRef.current,
      data_info: meta_data_typed,
      species: species,
      chromosome: chromosome,
    });

    return () => {
      workerRef.current?.terminate();
      mount.current = false;
    };
  }, []);

  // on data change
  useEffect(() => {
    if (mount.current && species) {
      messageToWorker({
        workerRef: workerRef.current,
        data_info: meta_data_typed,
        species: species,
        chromosome: chromosome,
      });
    }
  }, [species, chromosome]);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
      {/* NAV (top) */}
      <header className="h-14 flex-shrink-0 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
        <div className="w-full px-4 h-full flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">GenomeVis</h1>
          <SpeciesDropdown
            selectedOption={species}
            onSelectionChange={setSpecies}
            data={Object.keys(meta_data)}
            setChromosome={setChromosome}
            meta_data={meta_data_typed}
          />
          <ChromosomeDropdown
            selectedOption={chromosome}
            onSelectionChange={setChromosome}
            data={meta_data_typed[species].chromosomes ?? []}
          />
        </div>
      </header>

      {/* 3D PANEL */}
      <section className="flex-grow px-1 py-2 overflow-hidden">
        <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/40 p-3 shadow-inner flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">3D View</h2>
          </div>
          <div className="flex-1 rounded-xl bg-gray-800/40 grid place-items-center">
            <span className="text-sm text-gray-400">
              [React Three Fiber will mount here]
            </span>
          </div>
        </div>
      </section>

      {/* 2D PANEL */}
      <section className="h-[45%] px-1 pb-2 overflow-hidden">
        <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/40 p-3 shadow-inner flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">2D View</h2>
          </div>
          <div className="flex-1 rounded-xl bg-gray-800/40 grid place-items-center">
            <span className="text-sm text-gray-400">
              [Silhouettes Projections Densities]
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
