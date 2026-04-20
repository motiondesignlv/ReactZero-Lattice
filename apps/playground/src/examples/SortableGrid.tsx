import React, { useMemo } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin } from '@reactzero/lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const code = `
const plugins = useMemo(() => [
  sortPlugin<Employee>({ multiSort: true })
], [])

<Grid data={employees} rowKey="id" plugins={plugins}>
  <Grid.Header>
    <div className="grid-row grid-cols-4 header-row">
      <SortableHeader columnKey="name" label="Name" />
      <SortableHeader columnKey="department" label="Department" />
      <SortableHeader columnKey="role" label="Role" />
      <SortableHeader columnKey="salary" label="Salary" />
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-4">
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="role" />
        <Cell columnKey="salary"
          render={(v) => \`$\${Number(v).toLocaleString()}\`} />
      </div>
    </Row>
  </Grid.Body>
</Grid>

// SortableHeader uses usePlugin hook:
function SortableHeader({ columnKey, label }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const direction = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell"
         onClick={() => sort.toggleSort(columnKey)}>
      {label}
      <span className="sort-indicator">
        {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
      </span>
    </div>
  )
}
`

function SortableHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const direction = sort.isSorted(columnKey)

  return (
    <div
      className="cell sortable-cell"
      onClick={() => sort.toggleSort(columnKey)}
    >
      {label}
      <span className="sort-indicator">
        {direction === 'asc' ? ' \u2191' : direction === 'desc' ? ' \u2193' : ' \u2195'}
      </span>
    </div>
  )
}

export function SortableGrid() {
  const plugins = useMemo(() => [sortPlugin<Employee>({ multiSort: true })], [])

  return (
    <ExampleSection
      id="sortable"
      title="Sortable Grid"
      description="Click column headers to sort. Supports multi-column sort (asc → desc → none)."
      code={code}
    >
      <Grid data={employees} rowKey="id" plugins={plugins} aria-label="Sortable employee grid">
        <Grid.Header>
          <div className="grid-row grid-cols-4 header-row">
            <SortableHeader columnKey="name" label="Name" />
            <SortableHeader columnKey="department" label="Department" />
            <SortableHeader columnKey="role" label="Role" />
            <SortableHeader columnKey="salary" label="Salary" />
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row grid-cols-4">
              <Cell columnKey="name" />
              <Cell columnKey="department" />
              <Cell columnKey="role" />
              <Cell columnKey="salary" render={(value) => `$${Number(value).toLocaleString()}`} />
            </div>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
