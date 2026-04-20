import React, { useMemo, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin, useGridContext } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import { generateLargeDataset, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const data = generateLargeDataset(100)
const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance']

const code = `
const plugins = useMemo(() => [
  sortPlugin<Employee>({ multiSort: true }),
  filterPlugin<Employee>({ debounce: 150 }),
  paginatePlugin<Employee>({ pageSize: 10 }),
], [])

<Grid data={data} rowKey="id" plugins={plugins}
      emptyState={<div>No matching results</div>}>
  <Toolbar />
  <Grid.Header>
    <div className="grid-row grid-cols-5 header-row">
      <SortHeader columnKey="id" label="ID" />
      <SortHeader columnKey="name" label="Name" />
      <SortHeader columnKey="department" label="Dept" />
      <SortHeader columnKey="salary" label="Salary" />
      <SortHeader columnKey="status" label="Status" />
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-5">
        <Cell columnKey="id" />
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="salary" render={...} />
        <Cell columnKey="status" render={...} />
      </div>
    </Row>
  </Grid.Body>
  <Grid.Footer>
    <Pagination />
  </Grid.Footer>
</Grid>
`

function Toolbar() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')

  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          filter.setGlobalFilter(e.target.value)
        }}
        className="filter-input"
      />
      <select
        value={dept}
        onChange={(e) => {
          setDept(e.target.value)
          filter.setColumnFilter('department', e.target.value)
        }}
        className="column-filter-select"
      >
        <option value="">All Departments</option>
        {departments.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <button
        onClick={() => {
          setSearch('')
          setDept('')
          filter.clearFilters()
          sort.clearSort()
        }}
        className="clear-btn"
      >
        Reset All
      </button>
    </div>
  )
}

function SortHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
      {label}
      <span className="sort-indicator">
        {dir === 'asc' ? ' \u2191' : dir === 'desc' ? ' \u2193' : ' \u2195'}
      </span>
    </div>
  )
}

function Pagination() {
  const paginate = usePlugin<PaginatePluginAPI>('paginate')
  const grid = useGridContext()
  return (
    <div className="pagination-controls">
      <span className="page-info">{grid.totalFilteredRows} results</span>
      <button onClick={() => paginate.goToPage(0)} disabled={!paginate.hasPrevPage}>
        First
      </button>
      <button onClick={() => paginate.goToPrevPage()} disabled={!paginate.hasPrevPage}>
        Prev
      </button>
      <span className="page-info">
        Page {paginate.currentPage + 1} / {paginate.totalPages}
      </span>
      <button onClick={() => paginate.goToNextPage()} disabled={!paginate.hasNextPage}>
        Next
      </button>
      <button onClick={() => paginate.goToPage(paginate.totalPages - 1)} disabled={!paginate.hasNextPage}>
        Last
      </button>
      <select
        value={paginate.pageSize}
        onChange={(e) => paginate.setPageSize(Number(e.target.value))}
        className="page-size-select"
      >
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
        <option value={50}>50 per page</option>
      </select>
    </div>
  )
}

export function KitchenSinkGrid() {
  const plugins = useMemo(() => [
    sortPlugin<Employee>({ multiSort: true }),
    filterPlugin<Employee>({ debounce: 150 }),
    paginatePlugin<Employee>({ pageSize: 10 }),
  ], [])

  return (
    <ExampleSection
      id="kitchen-sink"
      title="Kitchen Sink"
      description="All plugins combined: sort + filter + pagination on 100 rows with column filter dropdown."
      code={code}
    >
      <Grid
        data={data}
        rowKey="id"
        plugins={plugins}
        aria-label="Full-featured employee grid"
        emptyState={<div className="empty-state">No matching results</div>}
      >
        <Toolbar />
        <Grid.Header>
          <div className="grid-row grid-cols-5 header-row">
            <SortHeader columnKey="id" label="ID" />
            <SortHeader columnKey="name" label="Name" />
            <SortHeader columnKey="department" label="Dept" />
            <SortHeader columnKey="salary" label="Salary" />
            <SortHeader columnKey="status" label="Status" />
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row grid-cols-5">
              <Cell columnKey="id" />
              <Cell columnKey="name" />
              <Cell columnKey="department" />
              <Cell columnKey="salary" render={(v) => `$${Number(v).toLocaleString()}`} />
              <Cell columnKey="status" render={(v) => (
                <span className={`status-badge status-${v}`}>{String(v)}</span>
              )} />
            </div>
          </Row>
        </Grid.Body>
        <Grid.Footer>
          <Pagination />
        </Grid.Footer>
      </Grid>
    </ExampleSection>
  )
}
