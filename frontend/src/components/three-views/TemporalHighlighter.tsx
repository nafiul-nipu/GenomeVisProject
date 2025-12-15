import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux-store/hooks";
import { setHighlightedGenesForLabel } from "../../redux-store/uiSlice";
import type {
  AgreementClass,
  GeneRowDataType,
} from "../../types/data_types_interfaces";

const EMPTY: number[] = [];

function indicesForLabel(
  geneData: GeneRowDataType[],
  byGeneName: Record<string, { agreement_class: AgreementClass }>,
  keep: Set<AgreementClass>
): number[] {
  if (!geneData.length || !keep.size) return EMPTY;

  const idxs: number[] = [];
  for (let i = 0; i < geneData.length; i++) {
    const g = geneData[i];
    const cls = byGeneName[g.gene_name]?.agreement_class;
    if (cls && keep.has(cls)) idxs.push(i);
  }
  return idxs;
}

export function TemporalHighlighter({ viewLabels }: { viewLabels: string[] }) {
  const dispatch = useAppDispatch();

  const species = useAppSelector((s) => s.ui.species);

  // which classes user wants to highlight
  const filter = useAppSelector((s) => s.ui.temporalClassFilter);

  // per-view gene arrays (already fetched)
  const gene_data = useAppSelector((s) => s.data.data?.gene_data) ?? {};

  // temporal trend lookup
  const temporalByGeneName =
    useAppSelector((s) => s.data.data?.temporalTrendData.byGeneName) ?? {};

  const keep = useMemo(() => new Set(filter), [filter]);

  useEffect(() => {
    // If filter is empty: clear highlights for these labels only (set to [])
    for (const label of viewLabels) {
      const arr = gene_data[label] ?? [];
      const idxs =
        keep.size === 0
          ? EMPTY
          : indicesForLabel(arr, temporalByGeneName, keep);

      dispatch(setHighlightedGenesForLabel({ label, indices: idxs }));
    }
  }, [dispatch, viewLabels, gene_data, temporalByGeneName, keep, species]);

  return null;
}
