import React, { useMemo, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin, useGridContext } from 'reactzero-lattice/react/hooks'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const code = `
const plugins = useMemo(() => [
  filterPlugin<Employee>({ debounce: 150 })
], [])

// Global search bar above the grid
function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <input
      placeholder="Search all columns..."
      onChange={(e) => filter.setGlobalFilter(e.target.value)}
    />
  )
}

// Per-column filter inputs embedded in the header row
function ColumnFilterHeader({ columnKey, label, type }) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <div className="filterable-header">
      <span>{label}</span>
      {type === 'select' ? (
        <select onChange={(e) =>
          filter.setColumnFilter(columnKey, e.target.value)
        }>
          <option value="">All</option>
          ...
        </select>
      ) : (
        <input
          placeholder={\`Filter \${label.toLowerCase()}...\`}
          onChange={(e) =>
            filter.setColumnFilter(columnKey, e.target.value)
          }
        />
      )}
    </div>
  )
}

<Grid data={employees} rowKey="id" plugins={plugins}>
  <GlobalSearch />
  <Grid.Header>
    <div className="grid-row">
      <ColumnFilterHeader columnKey="name" label="Name" type="text" />
      <ColumnFilterHeader columnKey="department" label="Department"
        type="select" options={departments} />
      <ColumnFilterHeader columnKey="role" label="Role" type="text" />
      <ColumnFilterHeader columnKey="status" label="Status"
        type="select" options={statuses} />
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-4">
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="role" />
        <Cell columnKey="status" render={...} />
      </div>
    </Row>
  </Grid.Body>
</Grid>
`

const departments = ['Engineering', 'Design', 'Marketing', 'Sales']
const statuses = ['active', 'inactive', 'on-leave']

function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const [search, setSearch] = useState('')

  return (
    <div className="filter-controls">
      <input
        type="text"
        placeholder="Search all columns..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          filter.setGlobalFilter(e.target.value)
        }}
        className="filter-input"
      />
      <button
        onClick={() => {
          setSearch('')
          filter.clearFilters()
        }}
        className="clear-btn"
      >
        Clear All
      </button>
    </div>
  )
}

function ColumnFilterHeader({
  columnKey,
  label,
  type = 'text',
  options,
}: {
  columnKey: keyof Employee & string
  label: string
  type?: 'text' | 'select'
  options?: string[]
}) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const [value, setValue] = useState('')

  return (
    <div className="filterable-header">
      <span>{label}</span>
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            filter.setColumnFilter(columnKey, e.target.value)
          }}
          className="header-filter-select"
        >
          <option value="">All</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="text"
          placeholder={`Filter...`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            filter.setColumnFilter(columnKey, e.target.value)
          }}
          className="header-filter-input"
        />
      )}
    </div>
  )
}

function FooterInfo() {
  const grid = useGridContext()
  return (
    <div className="grid-footer-info">
      Showing {grid.totalFilteredRows} of {grid.totalRows} rows
    </div>
  )
}

export function FilterableGrid() {
  const plugins = useMemo(() => [filterPlugin<Employee>({ debounce: 150 })], [])

  return (
    <ExampleSection
      id="filterable"
      title="Filterable Grid"
      description="Global search bar plus per-column filter inputs embedded in the header. Text inputs for free text, dropdowns for categories."
      code={code}
    >
      <Grid data={employees} rowKey="id" plugins={plugins} aria-label="Filterable employee grid">
        <GlobalSearch />
        <Grid.Header>
          <div className="grid-row grid-cols-4 header-row filterable-header-row">
            <ColumnFilterHeader columnKey="name" label="Name" type="text" />
            <ColumnFilterHeader columnKey="department" label="Department" type="select" options={departments} />
            <ColumnFilterHeader columnKey="role" label="Role" type="text" />
            <ColumnFilterHeader columnKey="status" label="Status" type="select" options={statuses} />
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row grid-cols-4">
              <Cell columnKey="name" />
              <Cell columnKey="department" />
              <Cell columnKey="role" />
              <Cell columnKey="status" render={(value) => (
                <span className={`status-badge status-${value}`}>{String(value)}</span>
              )} />
            </div>
          </Row>
        </Grid.Body>
        <Grid.Footer>
          <FooterInfo />
        </Grid.Footer>
      </Grid>
    </ExampleSection>
  )
}
