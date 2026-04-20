// packages/sort/src/index.ts

import type {
  LatticePlugin,
  ColumnKey,
  SortDirection,
  SortState,
} from '../core/types'

export type SortHeaderProps = {
  role: 'columnheader'
  'aria-sort': 'ascending' | 'descending' | 'none'
  tabIndex: number
  onClick: () => void
  onKeyDown: (e: { key: string; preventDefault: () => void }) => void
  'data-lattice-sort-toggle': true
}

export type SortPluginAPI<TData> = {
  setSortBy: (key: ColumnKey<TData>, direction: SortDirection) => void
  toggleSort: (key: ColumnKey<TData>) => void
  clearSort: () => void
  getSortState: () => SortState<TData>[]
  isSorted: (key: ColumnKey<TData>) => SortDirection
  getSortHeaderProps: (key: ColumnKey<TData>) => SortHeaderProps
  getSortStatusMessage: () => string
}

export type SortPluginOptions<TData> = {
  multiSort?: boolean
  manual?: boolean
  onSortChange?: (sortState: SortState<TData>[]) => void
}

export function sortPlugin<TData>(options: SortPluginOptions<TData> = {}): LatticePlugin<TData, SortPluginAPI<TData>> {
  const { multiSort = false, manual = false, onSortChange } = options

  const emit = (next: SortState<TData>[]) => {
    if (manual && onSortChange) onSortChange(next)
  }

  return {
    id: 'sort',

    initialState: {
      sortState: [],
    },

    init({ grid, dispatch }) {
      const toggleSort = (key: ColumnKey<TData>) => {
        const current = grid.state.sortState.find(s => s.key === key)
        let next: SortState<TData>[]
        if (!current) {
          next = multiSort
            ? [...grid.state.sortState, { key, direction: 'asc' }]
            : [{ key, direction: 'asc' }]
        } else if (current.direction === 'asc') {
          next = grid.state.sortState.map(
            s => s.key === key ? { ...s, direction: 'desc' as const } : s
          )
        } else {
          next = grid.state.sortState.filter(s => s.key !== key)
        }
        dispatch({ type: 'SET_SORT', payload: next })
        emit(next)
      }

      const isSorted = (key: ColumnKey<TData>): SortDirection =>
        grid.state.sortState.find(s => s.key === key)?.direction ?? false

      return {
        setSortBy: (key, direction) => {
          if (!direction) {
            const next = multiSort
              ? grid.state.sortState.filter(s => s.key !== key)
              : []
            dispatch({ type: 'SET_SORT', payload: next })
            emit(next)
            return
          }
          const newState: SortState<TData>[] = multiSort
            ? [...grid.state.sortState.filter(s => s.key !== key), { key, direction }]
            : [{ key, direction }]
          dispatch({ type: 'SET_SORT', payload: newState })
          emit(newState)
        },

        toggleSort,

        clearSort: () => {
          dispatch({ type: 'SET_SORT', payload: [] })
          emit([])
        },
        getSortState: () => grid.state.sortState,
        isSorted,

        getSortHeaderProps: (key) => {
          const direction = isSorted(key)
          return {
            role: 'columnheader',
            'aria-sort': direction === 'asc'
              ? 'ascending'
              : direction === 'desc'
                ? 'descending'
                : 'none',
            tabIndex: 0,
            onClick: () => toggleSort(key),
            onKeyDown: (e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                toggleSort(key)
              }
            },
            'data-lattice-sort-toggle': true,
          }
        },

        getSortStatusMessage: () => {
          const sorts = grid.state.sortState
          if (sorts.length === 0) return 'No sort applied'
          const describe = (s: SortState<TData>) =>
            `${String(s.key)} ${s.direction === 'asc' ? 'ascending' : 'descending'}`
          return `Sorted by ${sorts.map(describe).join(', ')}`
        },
      }
    },

    processSortedRows(rows, state) {
      if (manual) return rows
      if (!state.sortState.length) return rows

      return [...rows].sort((a, b) => {
        for (const { key, direction } of state.sortState) {
          const aVal = (a as any)[key]
          const bVal = (b as any)[key]

          let result = 0
          if (aVal == null && bVal == null) {
            result = 0
          } else if (aVal == null) {
            result = 1
          } else if (bVal == null) {
            result = -1
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            result = aVal - bVal
          } else if (aVal instanceof Date && bVal instanceof Date) {
            result = aVal.getTime() - bVal.getTime()
          } else {
            result = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
          }

          if (result !== 0) {
            return direction === 'asc' ? result : -result
          }
        }
        return 0
      })
    },
  }
}
