// packages/react/src/hooks/useGridReducer.ts

import type { GridState, GridAction, LatticePlugin } from '../../core/types'
import { initialGridState } from '../../core/utils'

export function gridReducer<TData>(
  state: GridState<TData>,
  action: GridAction<TData>,
  plugins: LatticePlugin<TData>[]
): GridState<TData> {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload, currentPage: 0 }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_SORT':
      return { ...state, sortState: action.payload, currentPage: 0 }

    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload, currentPage: 0 }

    case 'SET_COLUMN_FILTER':
      if (action.payload.value.trim() === '') {
        const nextFilters = { ...state.columnFilters }
        delete nextFilters[action.payload.key]
        return {
          ...state,
          columnFilters: nextFilters,
          currentPage: 0,
        }
      }

      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload.key]: action.payload.value,
        },
        currentPage: 0,
      }

    case 'CLEAR_COLUMN_FILTERS':
      return { ...state, columnFilters: {}, currentPage: 0 }

    case 'SET_PAGE':
      return { ...state, currentPage: Number.isFinite(action.payload) ? Math.max(0, Math.floor(action.payload)) : 0 }

    case 'SET_PAGE_SIZE':
      return {
        ...state,
        pageSize: Number.isFinite(action.payload) ? Math.max(1, Math.floor(action.payload)) : 1,
        currentPage: 0,
      }

    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedKeys)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, selectedKeys: next }
    }

    case 'SELECT_ALL': {
      return { ...state, selectedKeys: new Set(action.payload) }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedKeys: new Set() }

    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedKeys)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, expandedKeys: next }
    }

    case 'RESET':
      return initialGridState(action.payload)

    default:
      // Delegate to plugins
      let nextState = state
      for (const plugin of plugins) {
        if (plugin.reducer) {
          nextState = plugin.reducer(nextState, action)
        }
      }
      return nextState
  }
}
