// packages/core/src/utils.ts

import type { GridState } from './types'

export function initialGridState<TData>(data: TData[]): GridState<TData> {
  return {
    data,
    sortState: [],
    globalFilter: '',
    columnFilters: {},
    currentPage: 0,
    pageSize: 20,
    selectedKeys: new Set(),
    expandedKeys: new Set(),
    isLoading: false,
  }
}
