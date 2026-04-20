import { useMemo } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const code = `import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'

const plugins = [sortPlugin<Employee>({ multiSort: true })]

function SortableHeader({ columnKey, label }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
      {label} {dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}
    </div>
  )
}

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
        <Cell columnKey="salary" render={(v) => \`$\${Number(v).toLocaleString()}\`} />
      </div>
    </Row>
  </Grid.Body>
</Grid>`

function SortableHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
      {label}
      <span className="sort-indicator">{dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ' ↕'}</span>
    </div>
  )
}

export function SortingSection() {
  const plugins = useMemo(() => [sortPlugin<Employee>({ multiSort: true })], [])

  return (
    <section className="section" id="sorting">
      <div className="container">
        <div className="section-label">Plugin · reactzero-lattice/sort</div>
        <h2 className="section-title">Sort by any column, any direction</h2>
        <p className="section-desc">
          A tiny plugin that adds column sorting with ascending / descending / unsorted cycling.
          Multi-column mode lets you shift-click to stack sort keys. The plugin is framework-agnostic —
          React components consume it through the <code>usePlugin</code> hook. Need server-side sort?
          Pass <code>manual: true</code> + <code>onSortChange</code> and fetch ordered rows yourself —
          see <a href="#server-side">Client or server</a>.
        </p>
        <ExampleCard
          title="Sortable grid"
          description="Click a column header to cycle sort direction. Shift-click adds secondary sorts. The body scrolls while the header stays put."
          code={code}
        >
          <div className="table-scroll">
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
                    <Cell columnKey="salary" render={(v) => `$${Number(v).toLocaleString()}`} />
                  </div>
                </Row>
              </Grid.Body>
            </Grid>
          </div>
        </ExampleCard>
      </div>
    </section>
  )
}
