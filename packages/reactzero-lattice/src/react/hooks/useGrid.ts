// packages/react/src/hooks/useGrid.ts

import { useReducer, useMemo, useCallback } from 'react'
import { gridReducer } from './useGridReducer'
import { runPipeline } from '../../core/engine'
import { initialGridState } from '../../core/utils'
import type {
  GridState,
  GridAction,
  GridInstance,
  ColumnDef,
  LatticePlugin,
} from '../../core/types'

export type UseGridOptions<TData> = {
  data: TData[]
  columns?: ColumnDef<TData>[]
  plugins?: LatticePlugin<TData>[]
  rowKey: keyof TData & string
}

export function useGrid<TData>({
  data,
  columns = [],
  plugins = [],
  rowKey,
}: UseGridOptions<TData>): GridInstance<TData> {
  const initial = useMemo(() => {
    return plugins.reduce((acc, plugin) => ({
      ...acc,
      ...plugin.initialState,
    }), initialGridState<TData>(data))
  }, [data, plugins])

  const [state, dispatch] = useReducer(
    (s: GridState<TData>, a: GridAction<TData>) => gridReducer(s, a, plugins),
    initial
  )

  const { sortedRows, filteredRows, paginatedRows } = useMemo(
    () => runPipeline(data, state, plugins),
    [data, state, plugins]
  )

  const getRowKey = useCallback((row: TData) => {
    const value = row[rowKey]
    if (typeof value === 'string' || typeof value === 'number') return value
    throw new Error(`[Lattice] rowKey "${String(rowKey)}" must resolve to string | number`)
  }, [rowKey])

  const grid: GridInstance<TData> = useMemo(() => ({
    rawRows: data,
    sortedRows,
    filteredRows,
    paginatedRows,
    rows: paginatedRows,
    columns,
    state,
    dispatch,
    getRowKey,
    isSelected: (row) => state.selectedKeys.has(getRowKey(row)),
    isExpanded: (row) => state.expandedKeys.has(getRowKey(row)),
    totalRows: data.length,
    totalFilteredRows: filteredRows.length,
    totalPages: Math.ceil(filteredRows.length / state.pageSize),
    getGridProps: () => ({ role: 'grid' }),
    getHeaderProps: () => ({ role: 'rowgroup' }),
    getRowProps: (row: TData, index: number) => ({
      role: 'row',
      'aria-rowindex': index + 1,
    }),
    getCellProps: () => ({ role: 'gridcell' }),
    getStickyProps: () => ({}),
    getPlugin: (id: string) => {
      const plugin = plugins.find(p => p.id === id)
      if (!plugin) throw new Error(`Plugin ${id} not found`)
      return plugin.init({ grid: grid as any, columns, dispatch })
    },
    hasPlugin: (id: string) => plugins.some(p => p.id === id),
  }), [data, sortedRows, filteredRows, paginatedRows, state, columns, plugins, getRowKey])

  return grid
}
