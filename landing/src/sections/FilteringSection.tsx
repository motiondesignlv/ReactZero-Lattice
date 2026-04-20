import { useMemo, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin, useGridContext } from 'reactzero-lattice/react/hooks'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const departments = ['Engineering', 'Design', 'Marketing', 'Sales']
const statuses = ['active', 'inactive', 'on-leave']

const code = `import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'

const plugins = [filterPlugin<Employee>({ debounce: 150 })]

function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <input
      placeholder="Search all columns..."
      onChange={(e) => filter.setGlobalFilter(e.target.value)}
    />
  )
}

function ColumnFilter({ columnKey, label }) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <div className="filterable-header">
      <span>{label}</span>
      <input onChange={(e) => filter.setColumnFilter(columnKey, e.target.value)} />
    </div>
  )
}

<Grid data={employees} rowKey="id" plugins={plugins}>
  <GlobalSearch />
  <Grid.Header>
    <div className="grid-row grid-cols-4 filterable-header-row">
      <ColumnFilter columnKey="name" label="Name" />
      <ColumnFilter columnKey="department" label="Department" />
      <ColumnFilter columnKey="role" label="Role" />
      <ColumnFilter columnKey="status" label="Status" />
    </div>
  </Grid.Header>
  <Grid.Body>...</Grid.Body>
</Grid>`

function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const [v, setV] = useState('')
  return (
    <div className="filter-controls">
      <input
        className="filter-input"
        placeholder="Search all columns…"
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          filter.setGlobalFilter(e.target.value)
        }}
      />
      <button
        className="clear-btn"
        onClick={() => {
          setV('')
          filter.clearFilters()
        }}
      >
        Clear
      </button>
    </div>
  )
}

function ColumnFilter({
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
  const [v, setV] = useState('')
  return (
    <div className="filterable-header">
      <span>{label}</span>
      {type === 'select' && options ? (
        <select
          className="header-filter-select"
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            filter.setColumnFilter(columnKey, e.target.value)
          }}
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="header-filter-input"
          placeholder="Filter…"
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            filter.setColumnFilter(columnKey, e.target.value)
          }}
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

export function FilteringSection() {
  const plugins = useMemo(() => [filterPlugin<Employee>({ debounce: 150 })], [])

  return (
    <section className="section" id="filtering">
      <div className="container">
        <div className="section-label">Plugin · reactzero-lattice/filter</div>
        <h2 className="section-title">Filter globally or per column</h2>
        <p className="section-desc">
          One plugin, two patterns. A global search bar runs a debounced fuzzy match across every column,
          while per-column filters narrow results with text inputs or dropdowns. Both feed the same pipeline
          so sorting and pagination keep working. Need server-side filtering? Pass <code>manual: true</code>
          + <code>onFilterChange</code> and let your backend do the matching —
          see <a href="#server-side">Client or server</a>.
        </p>
        <ExampleCard
          title="Filterable grid"
          description="Type in the global bar or any header field. Status dropdown filters to enumerated values. The search bar, header, and footer stay fixed while the body scrolls."
          code={code}
        >
          <div className="table-scroll">
            <Grid data={employees} rowKey="id" plugins={plugins} aria-label="Filterable employee grid">
              <GlobalSearch />
              <Grid.Header>
                <div className="grid-row grid-cols-4 header-row filterable-header-row">
                  <ColumnFilter columnKey="name" label="Name" />
                  <ColumnFilter columnKey="department" label="Department" type="select" options={departments} />
                  <ColumnFilter columnKey="role" label="Role" />
                  <ColumnFilter columnKey="status" label="Status" type="select" options={statuses} />
                </div>
              </Grid.Header>
              <Grid.Body>
                <Row>
                  <div className="grid-row grid-cols-4">
                    <Cell columnKey="name" />
                    <Cell columnKey="department" />
                    <Cell columnKey="role" />
                    <Cell
                      columnKey="status"
                      render={(v) => <span className={`status-badge status-${v}`}>{String(v)}</span>}
                    />
                  </div>
                </Row>
              </Grid.Body>
              <Grid.Footer>
                <FooterInfo />
              </Grid.Footer>
            </Grid>
          </div>
        </ExampleCard>
      </div>
    </section>
  )
}
