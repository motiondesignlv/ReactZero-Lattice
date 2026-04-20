import { useCallback, useEffect, useMemo, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import type { SortState } from 'reactzero-lattice/core/types'
import { generateLargeDataset, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const FAKE_BACKEND = generateLargeDataset(1000)

type QueryState = {
  sort: SortState<Employee>[]
  globalFilter: string
  columnFilters: Partial<Record<keyof Employee & string, string>>
  page: number
  pageSize: number
}

type QueryResult = {
  rows: Employee[]
  total: number
}

function runFakeBackend(q: QueryState, signal: AbortSignal): Promise<QueryResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (signal.aborted) return
      let rows = FAKE_BACKEND

      if (q.globalFilter) {
        const term = q.globalFilter.toLowerCase()
        rows = rows.filter(r =>
          Object.values(r).some(v => String(v).toLowerCase().includes(term))
        )
      }
      for (const [key, value] of Object.entries(q.columnFilters)) {
        if (!value) continue
        const v = value.toLowerCase()
        rows = rows.filter(r => String((r as any)[key]).toLowerCase().includes(v))
      }

      if (q.sort.length) {
        rows = [...rows].sort((a, b) => {
          for (const { key, direction } of q.sort) {
            const av = (a as any)[key]
            const bv = (b as any)[key]
            const diff = typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true })
            if (diff !== 0) return direction === 'asc' ? diff : -diff
          }
          return 0
        })
      }

      const total = rows.length
      const start = q.page * q.pageSize
      const page = rows.slice(start, start + q.pageSize)
      resolve({ rows: page, total })
    }, 450)

    signal.addEventListener('abort', () => {
      clearTimeout(timeout)
      reject(new DOMException('aborted', 'AbortError'))
    })
  })
}

const code = `import { sortPlugin } from 'reactzero-lattice/sort'
import { filterPlugin } from 'reactzero-lattice/filter'
import { paginatePlugin } from 'reactzero-lattice/paginate'

function ServerGrid() {
  const [query, setQuery] = useState({ sort: [], globalFilter: '', columnFilters: {}, page: 0, pageSize: 10 })
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    fetch('/api/employees', { method: 'POST', body: JSON.stringify(query), signal: ac.signal })
      .then(r => r.json())
      .then(({ rows, total }) => { setData(rows); setTotal(total) })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [query])

  const plugins = useMemo(() => [
    sortPlugin({ manual: true, onSortChange: sort => setQuery(q => ({ ...q, sort, page: 0 })) }),
    filterPlugin({ manual: true, debounce: 200, onFilterChange: f => setQuery(q => ({ ...q, ...f, page: 0 })) }),
    paginatePlugin({ manual: true, pageSize: 10, onPaginationChange: p => setQuery(q => ({ ...q, page: p.currentPage, pageSize: p.pageSize })) }),
  ], [])

  return (
    <Grid data={data} rowCount={total} rowKey="id" plugins={plugins}
          loadingState={<div className="spinner">Loading…</div>}>
      {/* headers, body, footer exactly like client-side */}
    </Grid>
  )
}`

function SortableHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="filterable-header">
      <span className="sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
        {label}
        <span className="sort-indicator">{dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ' ↕'}</span>
      </span>
      <input
        className="header-filter-input"
        placeholder="Filter…"
        defaultValue=""
        onChange={(e) => filter.setColumnFilter(columnKey, e.target.value)}
      />
    </div>
  )
}

function ServerControls({ total, loading, lastLatency }: { total: number; loading: boolean; lastLatency: number | null }) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const pag = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="filter-controls">
      <input
        className="filter-input"
        placeholder="Search the 'server'…"
        onChange={(e) => filter.setGlobalFilter(e.target.value)}
      />
      <span className="server-badge">
        {loading ? 'Fetching…' : `${total.toLocaleString()} rows`}
        {lastLatency !== null && !loading ? ` · ${lastLatency}ms` : ''}
      </span>
      <div className="pagination-controls">
        <button onClick={() => pag.goToPrevPage()} disabled={!pag.hasPrevPage}>Prev</button>
        <span className="page-info">Page {pag.currentPage + 1} of {pag.totalPages || 1}</span>
        <button onClick={() => pag.goToNextPage()} disabled={!pag.hasNextPage}>Next</button>
      </div>
    </div>
  )
}

export function ServerSideSection() {
  const [data, setData] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastLatency, setLastLatency] = useState<number | null>(null)

  const [query, setQuery] = useState<QueryState>({
    sort: [],
    globalFilter: '',
    columnFilters: {},
    page: 0,
    pageSize: 10,
  })

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    const started = performance.now()
    runFakeBackend(query, ac.signal)
      .then((res) => {
        setData(res.rows)
        setTotal(res.total)
        setLastLatency(Math.round(performance.now() - started))
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') throw err
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [query])

  const onSortChange = useCallback((sort: SortState<Employee>[]) => {
    setQuery(q => ({ ...q, sort, page: 0 }))
  }, [])

  const onFilterChange = useCallback(
    (f: { globalFilter: string; columnFilters: Partial<Record<keyof Employee & string, string>> }) => {
      setQuery(q => ({ ...q, globalFilter: f.globalFilter, columnFilters: f.columnFilters, page: 0 }))
    },
    []
  )

  const onPaginationChange = useCallback(
    (p: { currentPage: number; pageSize: number }) => {
      setQuery(q => ({ ...q, page: p.currentPage, pageSize: p.pageSize }))
    },
    []
  )

  const plugins = useMemo(
    () => [
      sortPlugin<Employee>({ manual: true, onSortChange }),
      filterPlugin<Employee>({ manual: true, debounce: 250, onFilterChange }),
      paginatePlugin<Employee>({ manual: true, pageSize: 10, onPaginationChange }),
    ],
    [onSortChange, onFilterChange, onPaginationChange]
  )

  return (
    <section className="section" id="server-side">
      <div className="container">
        <div className="section-label">Plugin · all three</div>
        <h2 className="section-title">Client-side by default. Server-side when you need it.</h2>
        <p className="section-desc">
          Every pipeline plugin accepts <code>manual: true</code> and an <code>onChange</code> callback.
          When enabled, Lattice stops transforming rows in memory and hands control back to you — perfect
          for datasets too large to ship to the browser, server-side full-text search, or row-level auth.
          Mix and match per plugin: manual filter + manual paginate + client-side sort is a first-class combo.
        </p>
        <ExampleCard
          title="All three plugins in manual mode (1,000-row fake backend)"
          description="Every keystroke, header click, and page change triggers a fetch. Debounced filter keeps it to one request per pause. The grid shows the true server-side total via rowCount, and a loading state while requests are in flight."
          code={code}
        >
          <div className="table-scroll">
            <Grid
              data={data}
              rowCount={total}
              rowKey="id"
              plugins={plugins}
              aria-label="Server-side employee grid"
              className={loading ? 'is-fetching' : undefined}
            >
              <ServerControls total={total} loading={loading} lastLatency={lastLatency} />
              <Grid.Header>
                <div className="grid-row grid-cols-4 header-row filterable-header-row">
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
