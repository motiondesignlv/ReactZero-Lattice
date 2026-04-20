import React, { useMemo } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import { generateLargeDataset, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const largeData = generateLargeDataset(200)

const code = `
const largeData = generateLargeDataset(200)
const plugins = useMemo(() => [
  paginatePlugin<Employee>({ pageSize: 10 })
], [])

<Grid data={largeData} rowKey="id" plugins={plugins}>
  <Grid.Header>...</Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-4">
        <Cell columnKey="id" />
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="salary"
          render={(v) => \`$\${Number(v).toLocaleString()}\`} />
      </div>
    </Row>
  </Grid.Body>
  <Grid.Footer>
    <PaginationControls />
  </Grid.Footer>
</Grid>

// PaginationControls uses usePlugin hook:
function PaginationControls() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div>
      <button onClick={() => p.goToPrevPage()}
              disabled={!p.hasPrevPage}>Prev</button>
      <span>Page {p.currentPage + 1} of {p.totalPages}</span>
      <button onClick={() => p.goToNextPage()}
              disabled={!p.hasNextPage}>Next</button>
      <select onChange={(e) => p.setPageSize(Number(e.target.value))}>
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
      </select>
    </div>
  )
}
`

function PaginationControls() {
  const paginate = usePlugin<PaginatePluginAPI>('paginate')

  return (
    <div className="pagination-controls">
      <button onClick={() => paginate.goToPage(0)} disabled={!paginate.hasPrevPage}>
        First
      </button>
      <button onClick={() => paginate.goToPrevPage()} disabled={!paginate.hasPrevPage}>
        Prev
      </button>
      <span className="page-info">
        Page {paginate.currentPage + 1} of {paginate.totalPages}
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

export function PaginatedGrid() {
  const plugins = useMemo(() => [paginatePlugin<Employee>({ pageSize: 10 })], [])

  return (
    <ExampleSection
      id="paginated"
      title="Paginated Grid"
      description="200 rows with configurable page size and full navigation controls."
      code={code}
    >
      <Grid data={largeData} rowKey="id" plugins={plugins} aria-label="Paginated employee grid">
        <Grid.Header>
          <div className="grid-row grid-cols-4 header-row">
            <div className="cell cell-sm">ID</div>
            <div className="cell">Name</div>
            <div className="cell">Department</div>
            <div className="cell">Salary</div>
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row grid-cols-4">
              <Cell columnKey="id" />
              <Cell columnKey="name" />
              <Cell columnKey="department" />
              <Cell columnKey="salary" render={(value) => `$${Number(value).toLocaleString()}`} />
            </div>
          </Row>
        </Grid.Body>
        <Grid.Footer>
          <PaginationControls />
        </Grid.Footer>
      </Grid>
    </ExampleSection>
  )
}
