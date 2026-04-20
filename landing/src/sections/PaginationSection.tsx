import React, { useMemo, useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin } from '@reactzero/lattice/react/hooks'
import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'
import { generateLargeDataset, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const largeData = generateLargeDataset(200)

type Variant = 'numbered' | 'compact' | 'dropdown'

const VARIANTS: { key: Variant; label: string; hint: string }[] = [
  { key: 'numbered', label: 'Numbered', hint: '1 2 3 … N' },
  { key: 'compact', label: 'Compact', hint: 'First / Prev / Next / Last' },
  { key: 'dropdown', label: 'Dropdown', hint: 'Page [N ▾] of M' },
]

const CODE_BY_VARIANT: Record<Variant, string> = {
  numbered: `import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'

const plugins = [paginatePlugin<Employee>({ pageSize: 10 })]

function getPageRange(current: number, total: number, sib = 1, edge = 1) {
  const range: (number | 'gap')[] = []
  const start = Math.max(edge, current - sib)
  const end = Math.min(total - 1 - edge, current + sib)
  for (let i = 0; i < edge; i++) range.push(i)
  if (start > edge) range.push('gap')
  for (let i = start; i <= end; i++) range.push(i)
  if (end < total - 1 - edge) range.push('gap')
  for (let i = total - edge; i < total; i++) if (i > end) range.push(i)
  return range
}

function NumberedPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  const range = getPageRange(p.currentPage, p.totalPages)
  return (
    <div className="pagination-controls variant-numbered">
      <button onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>‹</button>
      {range.map((item, i) =>
        item === 'gap' ? (
          <span key={\`g\${i}\`} className="page-ellipsis">…</span>
        ) : (
          <button
            key={item}
            className={\`page-num\${item === p.currentPage ? ' active' : ''}\`}
            aria-current={item === p.currentPage ? 'page' : undefined}
            onClick={() => p.goToPage(item)}
          >
            {item + 1}
          </button>
        ),
      )}
      <button onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>›</button>
      <span className="page-spacer" />
      <select className="page-size-select" value={p.pageSize}
        onChange={(e) => p.setPageSize(Number(e.target.value))}>
        <option value={10}>10 / page</option>
        <option value={25}>25 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  )
}`,
  compact: `import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'

const plugins = [paginatePlugin<Employee>({ pageSize: 10 })]

function CompactPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls variant-compact">
      <button onClick={() => p.goToPage(0)} disabled={!p.hasPrevPage}>« First</button>
      <button onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>‹ Prev</button>
      <span className="page-info">Page {p.currentPage + 1} of {p.totalPages}</span>
      <button onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>Next ›</button>
      <button onClick={() => p.goToPage(p.totalPages - 1)} disabled={!p.hasNextPage}>Last »</button>
      <span className="page-spacer" />
      <select className="page-size-select" value={p.pageSize}
        onChange={(e) => p.setPageSize(Number(e.target.value))}>
        <option value={10}>10 / page</option>
        <option value={25}>25 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  )
}`,
  dropdown: `import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'

const plugins = [paginatePlugin<Employee>({ pageSize: 10 })]

function DropdownPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls variant-dropdown">
      <button onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>‹ Prev</button>
      <label className="page-jump">
        Page
        <select value={p.currentPage} onChange={(e) => p.goToPage(Number(e.target.value))}>
          {Array.from({ length: p.totalPages }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
        of {p.totalPages}
      </label>
      <button onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>Next ›</button>
      <span className="page-spacer" />
      <select className="page-size-select" value={p.pageSize}
        onChange={(e) => p.setPageSize(Number(e.target.value))}>
        <option value={10}>10 / page</option>
        <option value={25}>25 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  )
}`,
}

// Smart truncation: 1 ... 4 5 [6] 7 8 ... 20
function getPageRange(
  current: number,
  total: number,
  sib = 1,
  edge = 1,
): (number | 'gap')[] {
  if (total <= 0) return []
  if (total <= edge * 2 + sib * 2 + 3) {
    return Array.from({ length: total }, (_, i) => i)
  }
  const range: (number | 'gap')[] = []
  const start = Math.max(edge, current - sib)
  const end = Math.min(total - 1 - edge, current + sib)
  for (let i = 0; i < edge; i++) range.push(i)
  if (start > edge) range.push('gap')
  for (let i = start; i <= end; i++) range.push(i)
  if (end < total - 1 - edge) range.push('gap')
  for (let i = total - edge; i < total; i++) if (i > end) range.push(i)
  return range
}

function PageSizeSelect() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <select
      className="page-size-select"
      aria-label="Rows per page"
      value={p.pageSize}
      onChange={(e) => p.setPageSize(Number(e.target.value))}
    >
      <option value={10}>10 / page</option>
      <option value={25}>25 / page</option>
      <option value={50}>50 / page</option>
    </select>
  )
}

function NumberedPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  const range = getPageRange(p.currentPage, p.totalPages)
  return (
    <div className="pagination-controls variant-numbered" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="page-step"
        onClick={() => p.goToPrevPage()}
        disabled={!p.hasPrevPage}
        aria-label="Previous page"
      >
        ‹
      </button>
      <div className="page-num-list">
        {range.map((item, i) =>
          item === 'gap' ? (
            <span key={`g${i}`} className="page-ellipsis" aria-hidden="true">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`page-num${item === p.currentPage ? ' active' : ''}`}
              aria-current={item === p.currentPage ? 'page' : undefined}
              aria-label={`Go to page ${item + 1}`}
              onClick={() => p.goToPage(item)}
            >
              {item + 1}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="page-step"
        onClick={() => p.goToNextPage()}
        disabled={!p.hasNextPage}
        aria-label="Next page"
      >
        ›
      </button>
      <span className="page-spacer" />
      <PageSizeSelect />
    </div>
  )
}

function CompactPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls variant-compact" role="navigation" aria-label="Pagination">
      <button type="button" onClick={() => p.goToPage(0)} disabled={!p.hasPrevPage}>« First</button>
      <button type="button" onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>‹ Prev</button>
      <span className="page-info">
        Page {p.currentPage + 1} of {p.totalPages}
      </span>
      <button type="button" onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>Next ›</button>
      <button type="button" onClick={() => p.goToPage(p.totalPages - 1)} disabled={!p.hasNextPage}>Last »</button>
      <span className="page-spacer" />
      <PageSizeSelect />
    </div>
  )
}

function DropdownPagination() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls variant-dropdown" role="navigation" aria-label="Pagination">
      <button type="button" onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>‹ Prev</button>
      <label className="page-jump">
        Page
        <select
          aria-label="Jump to page"
          value={p.currentPage}
          onChange={(e) => p.goToPage(Number(e.target.value))}
        >
          {Array.from({ length: p.totalPages }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
        of {p.totalPages}
      </label>
      <button type="button" onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>Next ›</button>
      <span className="page-spacer" />
      <PageSizeSelect />
    </div>
  )
}

const PAGINATION_BY_VARIANT: Record<Variant, React.FC> = {
  numbered: NumberedPagination,
  compact: CompactPagination,
  dropdown: DropdownPagination,
}

export function PaginationSection() {
  const plugins = useMemo(() => [paginatePlugin<Employee>({ pageSize: 10 })], [])
  const [variant, setVariant] = useState<Variant>('numbered')

  const Pagination = PAGINATION_BY_VARIANT[variant]

  const variantPicker = (
    <div className="pagination-variants" role="radiogroup" aria-label="Pagination style">
      {VARIANTS.map((v) => (
        <button
          key={v.key}
          type="button"
          role="radio"
          aria-checked={variant === v.key}
          className={`pagination-variant-btn${variant === v.key ? ' active' : ''}`}
          onClick={() => setVariant(v.key)}
          title={v.hint}
        >
          {v.label}
        </button>
      ))}
    </div>
  )

  return (
    <section className="section" id="pagination">
      <div className="container">
        <div className="section-label">Plugin · @reactzero/lattice/paginate</div>
        <h2 className="section-title">Pagination that composes with everything</h2>
        <p className="section-desc">
          200 rows, configurable page size, full keyboard-friendly navigation — and it runs downstream of
          sort and filter so you always page through the already-narrowed dataset. The plugin is logic-only,
          so any pagination UI you can imagine works on top of the same API. Got millions of rows?
          Pass <code>manual: true</code> + <code>onPaginationChange</code> and fetch one page at a time —
          see <a href="#server-side">Client or server</a>.
        </p>
        <ExampleCard
          title="Paginated grid (200 rows)"
          description="Same plugin API, three pagination UIs. Pick a style — the grid stays in sync."
          code={CODE_BY_VARIANT[variant]}
          controls={variantPicker}
        >
          <div className="table-scroll">
            <Grid data={largeData} rowKey="id" plugins={plugins} aria-label="Paginated employee grid">
              <Grid.Header>
                <div className="grid-row grid-cols-4 header-row">
                  <div className="cell">Name</div>
                  <div className="cell">Department</div>
                  <div className="cell">Role</div>
                  <div className="cell">Salary</div>
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
              <Grid.Footer>
                <Pagination />
              </Grid.Footer>
            </Grid>
          </div>
        </ExampleCard>
      </div>
    </section>
  )
}
