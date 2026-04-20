// packages/core/src/engine.ts

import type { GridState, LatticePlugin } from './types'

export function runPipeline<TData>(
  data: TData[],
  state: GridState<TData>,
  plugins: LatticePlugin<TData>[]
): {
  sortedRows: TData[]
  filteredRows: TData[]
  paginatedRows: TData[]
} {
  // Stage 1: Sort
  let sortedRows = [...data]
  for (const plugin of plugins) {
    if (plugin.processSortedRows) {
      sortedRows = plugin.processSortedRows(sortedRows, state)
    }
  }

  // Stage 2: Filter
  let filteredRows = [...sortedRows]
  for (const plugin of plugins) {
    if (plugin.processFilteredRows) {
      filteredRows = plugin.processFilteredRows(filteredRows, state)
    }
  }

  // Stage 3: Paginate
  let paginatedRows = [...filteredRows]
  for (const plugin of plugins) {
    if (plugin.processPaginatedRows) {
      paginatedRows = plugin.processPaginatedRows(paginatedRows, state)
    }
  }

  return { sortedRows, filteredRows, paginatedRows }
}
