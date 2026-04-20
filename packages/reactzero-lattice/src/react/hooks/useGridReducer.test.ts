import { describe, expect, it } from 'vitest'
import { initialGridState } from '../../core/utils'
import type { GridAction, GridState, LatticePlugin } from '../../core/types'
import { gridReducer } from './useGridReducer'

type Row = {
  id: number
  name: string
}

const rows: Row[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

function reduce(
  state: GridState<Row>,
  action: GridAction<Row>,
  plugins: LatticePlugin<Row>[] = [],
) {
  return gridReducer(state, action, plugins)
}

describe('gridReducer', () => {
  it('adds and clears column filters', () => {
    const initial = initialGridState(rows)
    const withFilter = reduce(initial, {
      type: 'SET_COLUMN_FILTER',
      payload: { key: 'name', value: 'al' },
    })

    expect(withFilter.columnFilters).toEqual({ name: 'al' })

    const removedFilter = reduce(withFilter, {
      type: 'SET_COLUMN_FILTER',
      payload: { key: 'name', value: '   ' },
    })

    expect(removedFilter.columnFilters).toEqual({})
  })

  it('clears all column filters via CLEAR_COLUMN_FILTERS', () => {
    const state: GridState<Row> = {
      ...initialGridState(rows),
      columnFilters: { name: 'a', id: '1' },
    }

    const result = reduce(state, { type: 'CLEAR_COLUMN_FILTERS' })
    expect(result.columnFilters).toEqual({})
  })

  it('clamps invalid page and page size values', () => {
    const state = initialGridState(rows)

    const pageResult = reduce(state, { type: 'SET_PAGE', payload: -5 })
    expect(pageResult.currentPage).toBe(0)

    const pageSizeResult = reduce(state, { type: 'SET_PAGE_SIZE', payload: 0 })
    expect(pageSizeResult.pageSize).toBe(1)
    expect(pageSizeResult.currentPage).toBe(0)
  })

  it('delegates unknown actions to plugin reducers', () => {
    const plugin: LatticePlugin<Row> = {
      id: 'test-plugin',
      init: () => ({}),
      reducer: (state, action) => {
        if ((action as { type?: string }).type === 'PLUGIN_INCREMENT_PAGE') {
          return { ...state, currentPage: state.currentPage + 1 }
        }
        return state
      },
    }

    const state = initialGridState(rows)
    const result = gridReducer(
      state,
      { type: 'PLUGIN_INCREMENT_PAGE' } as unknown as GridAction<Row>,
      [plugin],
    )

    expect(result.currentPage).toBe(1)
  })
})
