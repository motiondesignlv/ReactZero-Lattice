// packages/filter/src/index.ts

import type { LatticePlugin, ColumnKey } from '../core/types'

export type FilterInputProps = {
  type: 'search'
  value: string
  'aria-label': string
  'aria-controls': string | undefined
  onChange: (e: { target: { value: string } }) => void
  'data-lattice-filter-input': true
}

export type FilterClearProps = {
  type: 'button'
  'aria-label': string
  onClick: () => void
  'data-lattice-filter-clear': true
}

export type FilterPluginAPI<TData> = {
  setGlobalFilter: (value: string) => void
  setColumnFilter: (key: ColumnKey<TData>, value: string) => void
  clearFilters: () => void
  getGlobalFilter: () => string
  getColumnFilter: (key: ColumnKey<TData>) => string
  getFilterInputProps: (key: ColumnKey<TData>, label: string) => FilterInputProps
  getGlobalFilterInputProps: (label?: string) => FilterInputProps
  getClearFilterProps: (label?: string) => FilterClearProps
  getFilterStatusMessage: () => string
}

// Augment the core state shape with our pending (pre-debounce) mirror.
// Stored under a namespaced key so we don't require changes to core types.
type PendingState = {
  __latticePendingGlobalFilter?: string
  __latticePendingColumnFilters?: Record<string, string>
}

export type FilterSnapshot<TData> = {
  globalFilter: string
  columnFilters: Partial<Record<ColumnKey<TData>, string>>
}

export type FilterPluginOptions<TData> = {
  debounce?: number
  manual?: boolean
  onFilterChange?: (filters: FilterSnapshot<TData>) => void
}

export function filterPlugin<TData>(options: FilterPluginOptions<TData> = {}): LatticePlugin<TData, FilterPluginAPI<TData>> {
  const { debounce = 200, manual = false, onFilterChange } = options
  let timer: ReturnType<typeof setTimeout> | undefined

  return {
    id: 'filter',

    initialState: {
      globalFilter: '',
      columnFilters: {},
      __latticePendingGlobalFilter: '',
      __latticePendingColumnFilters: {},
    } as any,

    reducer(state, action) {
      if (action.type === '__LATTICE_SET_PENDING_GLOBAL_FILTER') {
        return { ...state, __latticePendingGlobalFilter: action.payload } as any
      }
      if (action.type === '__LATTICE_SET_PENDING_COLUMN_FILTER') {
        const next = { ...((state as any).__latticePendingColumnFilters ?? {}) }
        if (!action.payload.value) delete next[action.payload.key]
        else next[action.payload.key] = action.payload.value
        return { ...state, __latticePendingColumnFilters: next } as any
      }
      if (action.type === '__LATTICE_CLEAR_PENDING_FILTERS') {
        return { ...state, __latticePendingGlobalFilter: '', __latticePendingColumnFilters: {} } as any
      }
      return state
    },

    init({ grid, dispatch }) {
      const getPending = () => grid.state as unknown as PendingState

      const emit = (overrides: Partial<FilterSnapshot<TData>> = {}) => {
        if (!manual || !onFilterChange) return
        onFilterChange({
          globalFilter: overrides.globalFilter ?? grid.state.globalFilter,
          columnFilters: overrides.columnFilters ?? grid.state.columnFilters,
        })
      }

      const setGlobalFilter = (value: string) => {
        dispatch({ type: '__LATTICE_SET_PENDING_GLOBAL_FILTER', payload: value } as any)
        clearTimeout(timer)
        timer = setTimeout(() => {
          dispatch({ type: 'SET_GLOBAL_FILTER', payload: value })
          emit({ globalFilter: value })
        }, debounce)
      }

      const setColumnFilter = (key: ColumnKey<TData>, value: string) => {
        dispatch({ type: '__LATTICE_SET_PENDING_COLUMN_FILTER', payload: { key, value } } as any)
        clearTimeout(timer)
        timer = setTimeout(() => {
          dispatch({ type: 'SET_COLUMN_FILTER', payload: { key, value } })
          const nextColumnFilters = { ...grid.state.columnFilters } as Partial<Record<ColumnKey<TData>, string>>
          if (!value || !value.trim()) delete nextColumnFilters[key]
          else nextColumnFilters[key] = value
          emit({ columnFilters: nextColumnFilters })
        }, debounce)
      }

      const clearFilters = () => {
        clearTimeout(timer)
        dispatch({ type: '__LATTICE_CLEAR_PENDING_FILTERS' } as any)
        dispatch({ type: 'SET_GLOBAL_FILTER', payload: '' })
        dispatch({ type: 'CLEAR_COLUMN_FILTERS' })
        emit({ globalFilter: '', columnFilters: {} })
      }

      return {
        setGlobalFilter,
        setColumnFilter,
        clearFilters,

        getGlobalFilter: () => getPending().__latticePendingGlobalFilter ?? grid.state.globalFilter,
        getColumnFilter: (key) =>
          getPending().__latticePendingColumnFilters?.[key as string]
            ?? (grid.state.columnFilters as any)[key]
            ?? '',

        getFilterInputProps: (key, label) => {
          const value = getPending().__latticePendingColumnFilters?.[key as string]
            ?? (grid.state.columnFilters as any)[key]
            ?? ''
          return {
            type: 'search',
            value,
            'aria-label': label,
            'aria-controls': undefined,
            onChange: (e) => setColumnFilter(key, e.target.value),
            'data-lattice-filter-input': true,
          }
        },

        getGlobalFilterInputProps: (label = 'Search all columns') => ({
          type: 'search',
          value: getPending().__latticePendingGlobalFilter ?? grid.state.globalFilter,
          'aria-label': label,
          'aria-controls': undefined,
          onChange: (e) => setGlobalFilter(e.target.value),
          'data-lattice-filter-input': true,
        }),

        getClearFilterProps: (label = 'Clear all filters') => ({
          type: 'button',
          'aria-label': label,
          onClick: clearFilters,
          'data-lattice-filter-clear': true,
        }),

        getFilterStatusMessage: () => {
          const total = grid.totalRows
          const shown = grid.totalFilteredRows
          if (shown === total) return `Showing all ${total} results`
          if (shown === 0) return 'No results match the current filters'
          return `Showing ${shown} of ${total} results`
        },
      }
    },

    processFilteredRows(rows, state) {
      if (manual) return rows
      let result = rows

      if (state.globalFilter) {
        const term = state.globalFilter.toLowerCase()
        result = result.filter(row =>
          Object.values(row as Record<string, unknown>)
            .some(val => String(val).toLowerCase().includes(term))
        )
      }

      for (const [key, value] of Object.entries(state.columnFilters) as Array<[string, string]>) {
        if (!value) continue
        result = result.filter(row =>
          String((row as any)[key]).toLowerCase().includes(value.toLowerCase())
        )
      }

      return result
    },
  }
}
