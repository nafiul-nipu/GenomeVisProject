/***
 * example
 * length = 5
 *
 * output:
 * [{source: 0, target: 1},
 * {source: 1, target: 2},
 * {source: 2, target: 3},
 * {source: 3, target: 4}]
 */

import type { Edge } from "../types/data_types_interfaces";

export async function createEdges(length: number): Promise<Edge[]> {
  return Array.from({ length: length - 1 }, (_, index) => ({
    source: index + 1,
    target: index + 2,
  }));
}
