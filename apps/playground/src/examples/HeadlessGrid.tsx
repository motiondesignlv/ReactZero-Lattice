import React, { useState, useMemo } from 'react'
import { useGrid } from '@reactzero/lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { filterPlugin, type FilterPluginAPI } from '@reactzero/lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'
import { tasks, type Task } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
const priorityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280',
}
const statusColors: Record<string, string> = {
  'todo': '#6b7280',
  'in-progress': '#3b82f6',
  'review': '#f59e0b',
  'done': '#22c55e',
}

const columns = [
  { key: 'title' as const, label: 'Title' },
  { key: 'assignee' as const, label: 'Assignee' },
  { key: 'priority' as const, label: 'Priority' },
  { key: 'status' as const, label: 'Status' },
  { key: 'dueDate' as const, label: 'Due Date' },
]

const code = `// HEADLESS: No <Grid>, <Row>, or <Cell> components!
// Just useGrid() + plugins + plain HTML.

import { useGrid } from '@reactzero/lattice/react/hooks'
import { sortPlugin } from '@reactzero/lattice/sort'
import { filterPlugin } from '@reactzero/lattice/filter'
import { paginatePlugin } from '@reactzero/lattice/paginate'

function MyCustomTable() {
  const grid = useGrid<Task>({
    data: tasks,
    rowKey: 'id',
    plugins: [sortPlugin(), filterPlugin(), paginatePlugin({ pageSize: 5 })],
  })

  const sortApi = grid.getPlugin<SortPluginAPI<Task>>('sort')
  const filterApi = grid.getPlugin<FilterPluginAPI<Task>>('filter')
  const paginateApi = grid.getPlugin<PaginatePluginAPI>('paginate')

  return (
    <>
      {/* Filter */}
      <input onChange={e => filterApi.setGlobalFilter(e.target.value)} />

      {/* Programmatic sort */}
      <button onClick={() => sortApi.setSortBy('priority', 'desc')}>
        Sort by Priority
      </button>

      {/* Plain HTML table — you control every element */}
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => sortApi.toggleSort(col.key)}>
                {col.label} {sortApi.isSorted(col.key) === 'asc' ? '▲' : sortApi.isSorted(col.key) === 'desc' ? '▼' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, i) => (
            <tr key={grid.getRowKey(row)}
                onClick={() => grid.dispatch({ type: 'TOGGLE_SELECT', payload: row.id })}
                className={grid.isSelected(row) ? 'selected' : ''}>
              <td>{row.title}</td>
              <td>{row.assignee}</td>
              <td>{row.priority}</td>
              <td>{row.status}</td>
              <td>{row.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <button onClick={() => paginateApi.goToPrevPage()}>Prev</button>
      <span>Page {paginateApi.currentPage + 1} of {paginateApi.totalPages}</span>
      <button onClick={() => paginateApi.goToNextPage()}>Next</button>

      {/* State inspector */}
      <pre>{JSON.stringify(grid.state, null, 2)}</pre>
    </>
  )
}`

export function HeadlessGrid() {
  const [showState, setShowState] = useState(false)
  const [filterValue, setFilterValue] = useState('')

  const sort = useMemo(() => sortPlugin<Task>(), [])
  const filter = useMemo(() => filterPlugin<Task>({ debounce: 0 }), [])
  const paginate = useMemo(() => paginatePlugin<Task>({ pageSize: 5 }), [])

  const grid = useGrid<Task>({
    data: tasks,
    rowKey: 'id',
    plugins: [sort, filter, paginate],
  })

  const sortApi = grid.getPlugin<SortPluginAPI<Task>>('sort')
  const filterApi = grid.getPlugin<FilterPluginAPI<Task>>('filter')
  const paginateApi = grid.getPlugin<PaginatePluginAPI>('paginate')

  const handleFilter = (value: string) => {
    setFilterValue(value)
    filterApi.setGlobalFilter(value)
  }

  const selectedCount = grid.state.selectedKeys.size

  const stateForDisplay = {
    sortState: grid.state.sortState,
    globalFilter: grid.state.globalFilter,
    currentPage: grid.state.currentPage,
    pageSize: grid.state.pageSize,
    selectedKeys: [...grid.state.selectedKeys],
    totalRows: grid.totalRows,
    totalFilteredRows: grid.totalFilteredRows,
    totalPages: grid.totalPages,
  }

  return (
    <ExampleSection
      id="headless"
      title="Headless API"
      description="Zero Lattice UI components. Uses useGrid() hook + plugins to drive a plain HTML <table>. Full programmatic control via dispatch, sort/filter/paginate APIs, and a live state inspector."
      code={code}
    >
      {/* Controls */}
      <div className="headless-controls">
        <div className="headless-controls-row">
          <input
            className="filter-input"
            placeholder="Filter tasks..."
            value={filterValue}
            onChange={e => handleFilter(e.target.value)}
          />
          <button className="clear-btn" onClick={() => handleFilter('')}>Clear</button>
        </div>

        <div className="headless-controls-row">
          <span className="headless-label">Programmatic Sort:</span>
          <button className="action-btn action-btn-view" onClick={() => sortApi.setSortBy('title', 'asc')}>
            Title A-Z
          </button>
          <button className="action-btn action-btn-view" onClick={() => sortApi.setSortBy('priority', 'desc')}>
            Priority High-Low
          </button>
          <button className="action-btn action-btn-view" onClick={() => sortApi.setSortBy('dueDate', 'asc')}>
            Due Date
          </button>
          <button className="clear-btn" onClick={() => sortApi.clearSort()}>Clear Sort</button>
        </div>

        <div className="headless-controls-row">
          <span className="headless-label">Selection:</span>
          <button className="action-btn action-btn-view" onClick={() => {
            const allKeys = grid.filteredRows.map(r => r.id)
            grid.dispatch({ type: 'SELECT_ALL', payload: allKeys })
          }}>
            Select All ({grid.totalFilteredRows})
          </button>
          <button className="clear-btn" onClick={() => grid.dispatch({ type: 'CLEAR_SELECTION' })}>
            Clear Selection
          </button>
          {selectedCount > 0 && (
            <span className="headless-selected-count">{selectedCount} selected</span>
          )}
        </div>
      </div>

      {/* Plain HTML table */}
      <table className="headless-table">
        <thead>
          <tr>
            <th className="headless-th-select">&nbsp;</th>
            {columns.map(col => {
              const dir = sortApi.isSorted(col.key)
              return (
                <th key={col.key} onClick={() => sortApi.toggleSort(col.key)} className="headless-th-sortable">
                  {col.label}
                  {dir === 'asc' && ' \u25B2'}
                  {dir === 'desc' && ' \u25BC'}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {grid.rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="headless-empty">No tasks match the filter.</td></tr>
          ) : (
            grid.rows.map(row => {
              const selected = grid.isSelected(row)
              return (
                <tr key={row.id} className={selected ? 'headless-row-selected' : ''}>
                  <td className="headless-td-select">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => grid.dispatch({ type: 'TOGGLE_SELECT', payload: row.id })}
                    />
                  </td>
                  <td>{row.title}</td>
                  <td>{row.assignee}</td>
                  <td>
                    <span className="headless-priority" style={{ color: priorityColors[row.priority] }}>
                      {row.priority}
                    </span>
                  </td>
                  <td>
                    <span className="headless-status" style={{ borderColor: statusColors[row.status], color: statusColors[row.status] }}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.dueDate}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination-controls">
        <button onClick={() => paginateApi.goToPrevPage()} disabled={!paginateApi.hasPrevPage}>
          Prev
        </button>
        <span className="page-info">
          Page {paginateApi.currentPage + 1} of {paginateApi.totalPages}
        </span>
        <button onClick={() => paginateApi.goToNextPage()} disabled={!paginateApi.hasNextPage}>
          Next
        </button>
        <select className="page-size-select" value={paginateApi.pageSize} onChange={e => paginateApi.setPageSize(Number(e.target.value))}>
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
        </select>
      </div>

      {/* State inspector toggle */}
      <div className="state-inspector">
        <button className="code-toggle" onClick={() => setShowState(!showState)}>
          {showState ? 'Hide' : 'Show'} State Inspector
        </button>
        {showState && (
          <pre className="code-pre">{JSON.stringify(stateForDisplay, null, 2)}</pre>
        )}
      </div>
    </ExampleSection>
  )
}
