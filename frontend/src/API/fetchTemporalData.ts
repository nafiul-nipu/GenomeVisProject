// src/API/fetchTemporalData.ts

import type {
  DataInfoType,
  TemporalTrendData,
  TemporalTrendRow,
  TemporalTrendRowRaw,
} from "../types/data_types_interfaces";

export interface FetchTemporalArgs {
  speciesName: string;
  chrName: string;
  dataInfo: DataInfoType;
}

function getNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function fetchTemporalData({
  speciesName,
  chrName,
  dataInfo,
}: FetchTemporalArgs): Promise<TemporalTrendData> {
  const base = import.meta.env.VITE_PUBLIC_DATA_PATH;
  const timepoints = dataInfo[speciesName].timepoints;

  const url = `${base}${speciesName}/temporal_data/${chrName}_temporal_data.json`;

  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`fetchTemporalData failed (${res.status}) ${url}`);
  }

  const rawRows = (await res.json()) as TemporalTrendRowRaw[];

  const rows: TemporalTrendRow[] = rawRows.map((r) => {
    const expr_delta_by_time: Record<string, number | null> = {};
    const acc_delta_by_time: Record<string, number | null> = {};

    for (const tp of timepoints) {
      const exprKey = `expr_delta_${tp}`;
      const accKey = `acc_delta_${tp}`;

      expr_delta_by_time[tp] = getNumberOrNull(r[exprKey]);
      acc_delta_by_time[tp] = getNumberOrNull(r[accKey]);
    }

    return {
      gene_id: r.gene_id ? String(r.gene_id) : r.gene_name,
      gene_name: String(r.gene_name),
      agreement_class: r.agreement_class,

      expr_delta_by_time,
      acc_delta_by_time,

      increase: getNumberOrNull(r.increase),
      decrease: getNumberOrNull(r.decrease),
      neutral: getNumberOrNull(r.neutral),
    };
  });

  const byGeneName: Record<string, TemporalTrendRow> = {};
  for (const row of rows) byGeneName[row.gene_name] = row;

  return { chr: chrName, timepoints, rows, byGeneName };
}
