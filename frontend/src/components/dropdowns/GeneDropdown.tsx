import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneDropdownProps } from "../../types/data_types_interfaces";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import { setSelectedGenes } from "../../redux-store/uiSlice";

// for fallback,a empty list
const EMPTY_GENES: readonly string[] = [];

export const GeneDropdown = ({
  placeholder = "Select genes...",
  className = "",
}: GeneDropdownProps) => {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.ui.selectedGenes);
  const options = useAppSelector((s) => s.data.data?.gene_list ?? EMPTY_GENES);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Click outside to close
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((g) => g.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (gene: string) => {
    if (selected.includes(gene)) {
      dispatch(setSelectedGenes(selected.filter((s) => s !== gene)));
    } else {
      dispatch(setSelectedGenes([...selected, gene]));
    }
  };

  const removeChip = (gene: string) => {
    dispatch(setSelectedGenes(selected.filter((s) => s !== gene)));
  };

  const clearAll = () => dispatch(setSelectedGenes([]));

  const openAndFocus = () => {
    setOpen((o) => !o);
    // focus input when menu opens
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-[24rem] max-w-[40vw] ${className}`}
    >
      {/* Control */}
      <div
        role="button"
        tabIndex={0}
        onClick={openAndFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openAndFocus();
          }
        }}
        className="w-full min-h-10 px-3 py-2 text-left bg-gray-900/60 border border-gray-800/60 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 flex items-center gap-2"
      >
        <div className="flex flex-wrap gap-1 items-center">
          {selected.length === 0 && (
            <span className="text-gray-400">{placeholder}</span>
          )}
          {selected.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-800 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {g}
              <button
                aria-label={`Remove ${g}`}
                className="hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(g);
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Menu */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-800/60 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70 shadow-xl">
          {/* Search */}
          <div className="p-2 border-b border-gray-800/60">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search genes…"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-800/60 outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <div>
                Showing {filtered.length} of {options.length}
              </div>
              <div className="space-x-2">
                <button
                  className="underline underline-offset-2 hover:text-gray-200"
                  onClick={clearAll}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-72 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">
                No genes found
              </li>
            )}
            {filtered.map((g) => {
              const isSel = selected.includes(g);
              return (
                <li
                  key={g}
                  className="px-3 py-2 text-sm hover:bg-gray-800/80 cursor-pointer flex items-center gap-2"
                  onClick={() => toggle(g)}
                >
                  <input
                    readOnly
                    type="checkbox"
                    checked={isSel}
                    className="accent-sky-500"
                  />
                  <span className={isSel ? "text-sky-300" : ""}>{g}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
