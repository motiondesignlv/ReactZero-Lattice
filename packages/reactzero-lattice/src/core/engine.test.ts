import { describe, expect, it } from 'vitest'
import { runPipeline } from './engine'
import { initialGridState } from './utils'
import type { GridState, LatticePlugin } from './types'

type Row = {
  id: number
  name: string
  team: 'alpha' | 'beta'
}

const rows: Row[] = [
  { id: 1, name: 'Zoe', team: 'alpha' },
  { id: 2, name: 'Alice', team: 'beta' },
  { id: 3, name: 'Bob', team: 'alpha' },
  { id: 4, name: 'Aaron', team: 'alpha' },
]

const sortPlugin: LatticePlugin<Row> = {
  id: 'sort',
  init: () => ({}),
  processSortedRows(input, state) {
    if (!state.sortState.length) return input

    return [...input].sort((a, b) => {
      const direction = state.sortState[0]?.direction ?? 'asc'
      const cmp = a.name.localeCompare(b.name)
      return direction === 'asc' ? cmp : -cmp
    })
  },
}

const filterPlugin: LatticePlugin<Row> = {
  id: 'filter',
  init: () => ({}),
  processFilteredRows(input, state) {
    if (!state.globalFilter) return input
    const term = state.globalFilter.toLowerCase()
    return input.filter((row) => row.team.includes(term))
  },
}

const paginatePlugin: LatticePlugin<Row> = {
  id: 'paginate',
  init: () => ({}),
  processPaginatedRows(input, state) {
    const pageSize = Math.max(state.pageSize, 1)
    const start = state.currentPage * pageSize
    return input.slice(start, start + pageSize)
  },
}

describe('runPipeline', () => {
  it('returns all rows unchanged without plugins', () => {
    const state = initialGridState(rows)
    const result = runPipeline(rows, state, [])

    expect(result.sortedRows).toEqual(rows)
    expect(result.filteredRows).toEqual(rows)
    expect(result.paginatedRows).toEqual(rows)
  })

  it('applies pipeline stages in order: sort -> filter -> paginate', () => {
    const state: GridState<Row> = {
      ...initialGridState(rows),
      sortState: [{ key: 'name', direction: 'asc' }],
      globalFilter: 'alpha',
      currentPage: 0,
      pageSize: 2,
    }

    const result = runPipeline(rows, state, [sortPlugin, filterPlugin, paginatePlugin])

    expect(result.sortedRows.map((row) => row.name)).toEqual(['Aaron', 'Alice', 'Bob', 'Zoe'])
    expect(result.filteredRows.map((row) => row.name)).toEqual(['Aaron', 'Bob', 'Zoe'])
    expect(result.paginatedRows.map((row) => row.name)).toEqual(['Aaron', 'Bob'])
  })

  it('does not mutate source data', () => {
    const source = [...rows]
    const state: GridState<Row> = {
      ...initialGridState(source),
      sortState: [{ key: 'name', direction: 'asc' }],
    }

    runPipeline(source, state, [sortPlugin])

    expect(source.map((row) => row.name)).toEqual(['Zoe', 'Alice', 'Bob', 'Aaron'])
  })
})

