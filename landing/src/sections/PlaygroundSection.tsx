import React, { useMemo, useRef, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin, useGridContext } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import { generateLargeDataset, type Employee } from '../data/sampleData'
import { CodeBlock } from '../components/CodeBlock'

type Density = 'comfortable' | 'compact'
type Theme = 'light' | 'dark'
type ColKey = 'name' | 'department' | 'role' | 'salary' | 'status'

type ColumnDef = {
  key: ColKey
  label: string
  width: number
  minWidth: number
  visible: boolean
  frozen: boolean
}

const initialColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', width: 180, minWidth: 120, visible: true, frozen: true },
  { key: 'department', label: 'Department', width: 150, minWidth: 100, visible: true, frozen: false },
  { key: 'role', label: 'Role', width: 180, minWidth: 100, visible: true, frozen: false },
  { key: 'salary', label: 'Salary', width: 130, minWidth: 90, visible: true, frozen: false },
  { key: 'status', label: 'Status', width: 130, minWidth: 90, visible: true, frozen: false },
]

const dataset = generateLargeDataset(60)

// Row heights used to compute sticky offsets for pinned rows.
const HEADER_H = 44
const PINNED_ROW_H = 44

/* ── icons ─────────────────────────────────────────────── */

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="5.5" r="3" />
      <line x1="8" y1="8.5" x2="8" y2="14" />
    </svg>
  )
}

/* ── header cells ──────────────────────────────────────── */

type HeaderInnerProps = {
  col: ColumnDef
  index: number
  onStartDrag: (e: React.DragEvent, index: number) => void
  onResize: (col: ColumnDef, e: React.PointerEvent) => void
}

function SortableHeaderInner({ col, index, onStartDrag, onResize }: HeaderInnerProps) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(col.key)
  return (
    <>
      <div
        className="header-drag-handle"
        draggable
        onDragStart={(e) => onStartDrag(e, index)}
        onClick={() => sort.toggleSort(col.key)}
        title="Click to sort · drag to reorder"
      >
        <span className="header-drag-grip" aria-hidden>⋮⋮</span>
        <span className="header-drag-label">{col.label}</span>
        <span className="sort-indicator">
          {dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}
        </span>
      </div>
      <div
        className="resize-handle"
        onPointerDown={(e) => onResize(col, e)}
        title="Drag to resize"
      />
    </>
  )
}

function PlainHeaderInner({ col, index, onStartDrag, onResize }: HeaderInnerProps) {
  return (
    <>
      <div
        className="header-drag-handle"
        draggable
        onDragStart={(e) => onStartDrag(e, index)}
        title="Drag to reorder"
      >
        <span className="header-drag-grip" aria-hidden>⋮⋮</span>
        <span className="header-drag-label">{col.label}</span>
      </div>
      <div
        className="resize-handle"
        onPointerDown={(e) => onResize(col, e)}
        title="Drag to resize"
      />
    </>
  )
}

function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const [v, setV] = useState('')
  return (
    <div className="filter-controls">
      <input
        className="filter-input"
        placeholder="Search…"
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

function PaginationControls() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls">
      <button onClick={() => p.goToPrevPage()} disabled={!p.hasPrevPage}>
        Prev
      </button>
      <span className="page-info">
        Page {p.currentPage + 1} of {p.totalPages || 1}
      </span>
      <button onClick={() => p.goToNextPage()} disabled={!p.hasNextPage}>
        Next
      </button>
    </div>
  )
}

function RowCount() {
  const grid = useGridContext()
  return (
    <div className="grid-footer-info">
      {grid.totalFilteredRows} of {grid.totalRows} rows
    </div>
  )
}

/* ── renderers shared by Lattice cells AND manual pinned rows ─── */

function renderCellValue(col: ColumnDef, row: Employee): React.ReactNode {
  const v = (row as any)[col.key]
  if (col.key === 'salary') return `$${Number(v).toLocaleString()}`
  if (col.key === 'status')
    return <span className={`status-badge status-${v}`}>{String(v)}</span>
  return String(v)
}

/* ── code generator ────────────────────────────────────── */

function buildCode(opts: {
  sort: boolean
  filter: boolean
  paginate: boolean
  pageSize: number
  columns: ColumnDef[]
  pinnedCount: number
}) {
  const visible = opts.columns.filter((c) => c.visible)
  const frozen = visible.filter((c) => c.frozen)
  const scroll = visible.filter((c) => !c.frozen)
  const ordered = [...frozen, ...scroll]
  const pluginList: string[] = []
  if (opts.sort) pluginList.push('sortPlugin<Employee>({ multiSort: true })')
  if (opts.filter) pluginList.push('filterPlugin<Employee>({ debounce: 150 })')
  if (opts.paginate) pluginList.push(`paginatePlugin<Employee>({ pageSize: ${opts.pageSize} })`)

  const imports = [
    "import { Grid, Row, Cell } from 'reactzero-lattice/react/components'",
    opts.sort || opts.filter || opts.paginate
      ? "import { usePlugin } from 'reactzero-lattice/react/hooks'"
      : null,
    opts.sort ? "import { sortPlugin } from 'reactzero-lattice/sort'" : null,
    opts.filter ? "import { filterPlugin } from 'reactzero-lattice/filter'" : null,
    opts.paginate ? "import { paginatePlugin } from 'reactzero-lattice/paginate'" : null,
  ]
    .filter(Boolean)
    .join('\n')

  const template = ordered.map((c) => `${c.width}px`).join(' ')
  const cells = ordered
    .map((c, i) => {
      const sticky = c.frozen
        ? ordered.slice(0, i).reduce((s, p) => s + (p.frozen ? p.width : 0), 0)
        : null
      const stickyAttr = sticky !== null
        ? ` className="cell-frozen" style={{ position: 'sticky', left: ${sticky}, zIndex: 1 }}`
        : ''
      return `        <Cell columnKey="${c.key}"${stickyAttr} />`
    })
    .join('\n')
  const headers = ordered
    .map((c) => `      <div className="cell">${c.label}</div>`)
    .join('\n')
  const pluginsLine = pluginList.length
    ? `const plugins = [\n  ${pluginList.join(',\n  ')}\n]\n\n`
    : ''

  const pinNote =
    opts.pinnedCount > 0
      ? `// ${opts.pinnedCount} row${opts.pinnedCount > 1 ? 's' : ''} pinned — rendered above Grid.Body with position: sticky; top: headerHeight\n`
      : ''

  return `${imports}

${pluginsLine}${pinNote}// columns state: order + width + visible + frozen
const [columns, setColumns] = useState([
${ordered.map((c) => `  { key: '${c.key}', label: '${c.label}', width: ${c.width}, frozen: ${c.frozen} },`).join('\n')}
])

const template = columns.map(c => \`\${c.width}px\`).join(' ')
// grid-template-columns: ${template}

<div className="pg-scroll">                          {/* overflow: auto; max-height */}
  <Grid data={rows} rowKey="id"${pluginList.length ? ' plugins={plugins}' : ''}>
    <Grid.Header>
      <div className="grid-row header-row pg-header"
           style={{ gridTemplateColumns: template }}>
${headers}
      </div>
    </Grid.Header>

    {/* Pinned rows — rendered inline between Header and Body,
        sticky top: headerHeight + pinIndex * rowHeight */}
    {pinned.map((row, i) => (
      <div className="grid-row pg-pinned-row"
           style={{
             gridTemplateColumns: template,
             top: \`\${headerH + i * rowH}px\`,
           }}>
        {columns.map(col => <PinnedCell col={col} row={row} />)}
      </div>
    ))}

    <Grid.Body>
      <Row>
        <div className="grid-row" style={{ gridTemplateColumns: template }}>
${cells}
        </div>
      </Row>
    </Grid.Body>${opts.paginate ? '\n    <Grid.Footer><PaginationControls /></Grid.Footer>' : ''}
  </Grid>
</div>`
}

/* ── the section ───────────────────────────────────────── */

export function PlaygroundSection() {
  const [sort, setSort] = useState(true)
  const [filter, setFilter] = useState(true)
  const [paginate, setPaginate] = useState(false)
  const [pageSize, setPageSize] = useState(25)
  const [density, setDensity] = useState<Density>('comfortable')
  const [striped, setStriped] = useState(true)
  const [theme, setTheme] = useState<Theme>('light')
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns)
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => new Set([1]))
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  const plugins = useMemo(() => {
    const list: any[] = []
    if (sort) list.push(sortPlugin<Employee>({ multiSort: true }))
    if (filter) list.push(filterPlugin<Employee>({ debounce: 150 }))
    if (paginate) list.push(paginatePlugin<Employee>({ pageSize }))
    return list
  }, [sort, filter, paginate, pageSize])

  const gridKey = `${sort}-${filter}-${paginate}-${pageSize}`

  // Frozen columns render first so sticky left offsets work cleanly.
  const { ordered, template, offsets } = useMemo(() => {
    const visible = columns.filter((c) => c.visible)
    const frozen = visible.filter((c) => c.frozen)
    const scroll = visible.filter((c) => !c.frozen)
    const ordered = [...frozen, ...scroll]
    const template = ordered.map((c) => `${c.width}px`).join(' ')
    const offsets = ordered.map((_c, i) =>
      ordered.slice(0, i).reduce((sum, c) => sum + (c.frozen ? c.width : 0), 0),
    )
    return { ordered, template, offsets }
  }, [columns])

  const colCount = ordered.length || 1

  // Data split for row pinning: pinned rows always visible, unpinned rows
  // flow through Lattice's normal sort/filter/paginate pipeline.
  const { pinnedRows, mainRows } = useMemo(() => {
    const pinned = dataset.filter((r) => pinnedIds.has(r.id))
    const main = dataset.filter((r) => !pinnedIds.has(r.id))
    return { pinnedRows: pinned, mainRows: main }
  }, [pinnedIds])

  const toggleColumn = (key: ColKey) => {
    setColumns((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
      if (next.filter((c) => c.visible).length === 0) return prev
      return next
    })
  }
  const toggleFrozen = (key: ColKey) =>
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, frozen: !c.frozen } : c)))

  const togglePinned = (id: number) =>
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const reorder = (srcVisibleIdx: number, dstVisibleIdx: number) => {
    if (srcVisibleIdx === dstVisibleIdx) return
    const src = ordered[srcVisibleIdx]
    const dst = ordered[dstVisibleIdx]
    if (!src || !dst || src.frozen !== dst.frozen) return
    setColumns((prev) => {
      const next = [...prev]
      const a = next.findIndex((c) => c.key === src.key)
      const b = next.findIndex((c) => c.key === dst.key)
      if (a === -1 || b === -1) return prev
      const [moved] = next.splice(a, 1)
      next.splice(b, 0, moved!)
      return next
    })
  }

  const startResize = (col: ColumnDef, e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startW = col.width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      const w = Math.max(col.minWidth, Math.min(480, startW + (ev.clientX - startX)))
      setColumns((prev) => prev.map((c) => (c.key === col.key ? { ...c, width: w } : c)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startDrag = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
    dragSrcIdx.current = index
  }

  const resetColumns = () => setColumns(initialColumns)

  const code = buildCode({
    sort,
    filter,
    paginate,
    pageSize,
    columns,
    pinnedCount: pinnedIds.size,
  })

  return (
    <section className="section" id="playground">
      <div className="container">
        <div className="section-label">Live playground</div>
        <h2 className="section-title">Configure every feature in real time</h2>
        <p className="section-desc">
          Toggle plugins, flip themes, show / hide columns, drag headers to reorder, drag edges to resize,
          pin columns so they stay put when you scroll horizontally, and pin rows so they stay put when you
          scroll vertically. The code below mirrors every change — copy it straight into your project.
        </p>

        <div className="playground-layout">
          <aside className="playground-controls">
            <h4>Plugins</h4>
            <div className="control-row">
              <label htmlFor="pg-sort">Sort</label>
              <input id="pg-sort" type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} />
            </div>
            <div className="control-row">
              <label htmlFor="pg-filter">Filter</label>
              <input id="pg-filter" type="checkbox" checked={filter} onChange={(e) => setFilter(e.target.checked)} />
            </div>
            <div className="control-row">
              <label htmlFor="pg-paginate">Paginate</label>
              <input
                id="pg-paginate"
                type="checkbox"
                checked={paginate}
                onChange={(e) => setPaginate(e.target.checked)}
              />
            </div>
            {paginate && (
              <div className="control-row">
                <label>Page size</label>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}

            <h4>Columns</h4>
            <p className="playground-hint">
              Drag header to reorder · drag edge to resize · pin to freeze left.
            </p>
            {columns.map((col) => (
              <div className="control-row control-row-col" key={col.key}>
                <label htmlFor={`pg-col-${col.key}`}>
                  {col.label}
                  {col.visible && <span className="control-width">{col.width}px</span>}
                </label>
                <button
                  type="button"
                  className={`freeze-btn ${col.frozen ? 'active' : ''}`}
                  onClick={() => toggleFrozen(col.key)}
                  aria-pressed={col.frozen}
                  title={col.frozen ? 'Unfreeze column' : 'Freeze column'}
                >
                  <PinIcon filled={col.frozen} />
                </button>
                <input
                  id={`pg-col-${col.key}`}
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumn(col.key)}
                />
              </div>
            ))}
            <button className="clear-btn playground-reset" onClick={resetColumns}>
              Reset columns
            </button>

            <h4>Pinned rows</h4>
            <p className="playground-hint">
              Click the pin icon on any row to pin it to the top. The row stays stuck while
              the rest of the body scrolls vertically.
            </p>
            <div className="pg-pinned-count">
              {pinnedIds.size === 0 ? (
                <span className="pg-pinned-none">No pinned rows</span>
              ) : (
                <>
                  <span>{pinnedIds.size} pinned</span>
                  <button className="clear-btn" onClick={() => setPinnedIds(new Set())}>
                    Clear all
                  </button>
                </>
              )}
            </div>

            <h4>Appearance</h4>
            <div className="control-row">
              <label>Density</label>
              <select value={density} onChange={(e) => setDensity(e.target.value as Density)}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="pg-striped">Striped rows</label>
              <input
                id="pg-striped"
                type="checkbox"
                checked={striped}
                onChange={(e) => setStriped(e.target.checked)}
              />
            </div>
            <div className="control-row">
              <label>Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </aside>

          <div className="playground-preview">
            <div className="playground-preview-header">
              <div className="playground-badges">
                <span className={`playground-badge ${sort ? '' : 'muted'}`}>sort</span>
                <span className={`playground-badge ${filter ? '' : 'muted'}`}>filter</span>
                <span className={`playground-badge ${paginate ? '' : 'muted'}`}>paginate</span>
                <span className={`playground-badge ${columns.some((c) => c.frozen) ? '' : 'muted'}`}>freeze</span>
                <span className={`playground-badge ${pinnedIds.size > 0 ? '' : 'muted'}`}>pin rows</span>
              </div>
              <div className="playground-badges">
                <span className="playground-badge muted">{dataset.length} rows</span>
                <span className="playground-badge muted">{colCount} cols</span>
              </div>
            </div>
            <div
              className={`playground-preview-body ${theme === 'dark' ? 'theme-dark demo-dark' : ''}`}
              data-density={density}
              data-striped={striped ? 'true' : 'false'}
            >
              <Grid
                key={gridKey}
                data={mainRows}
                rowKey="id"
                plugins={plugins}
                aria-label="Interactive Lattice playground grid"
              >
                {filter && (
                  <div className="pg-top-bar">
                    <GlobalSearch />
                  </div>
                )}
                <div className="pg-scroll">
                  <div className="pg-scroll-content">
                    <Grid.Header>
                    <div
                      className="grid-row header-row pg-header"
                      style={{ gridTemplateColumns: template }}
                    >
                      {ordered.map((col, i) => {
                        const frozenStyle: React.CSSProperties = col.frozen
                          ? { position: 'sticky', left: offsets[i], zIndex: 5 }
                          : {}
                        return (
                          <div
                            key={col.key}
                            className={`cell header-cell ${col.frozen ? 'cell-frozen cell-frozen-head' : ''} ${dragOverIdx === i ? 'drop-target' : ''}`}
                            style={frozenStyle}
                            onDragOver={(e) => {
                              if (dragSrcIdx.current === null) return
                              const src = ordered[dragSrcIdx.current]
                              if (!src || src.frozen !== col.frozen) return
                              e.preventDefault()
                              setDragOverIdx(i)
                            }}
                            onDragLeave={() =>
                              setDragOverIdx((cur) => (cur === i ? null : cur))
                            }
                            onDrop={(e) => {
                              e.preventDefault()
                              const src = Number(e.dataTransfer.getData('text/plain'))
                              setDragOverIdx(null)
                              dragSrcIdx.current = null
                              if (!Number.isNaN(src)) reorder(src, i)
                            }}
                          >
                            {sort ? (
                              <SortableHeaderInner
                                col={col}
                                index={i}
                                onStartDrag={startDrag}
                                onResize={startResize}
                              />
                            ) : (
                              <PlainHeaderInner
                                col={col}
                                index={i}
                                onStartDrag={startDrag}
                                onResize={startResize}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Grid.Header>

                  {/* Pinned rows live between Header and Body so they share the
                      same horizontal scroll container. position: sticky; top:
                      headerH + idx * pinnedRowH keeps them below the header and
                      visible during vertical scroll. */}
                  {pinnedRows.length > 0 && (
                    <div className="pg-pinned" aria-label="Pinned rows">
                      {pinnedRows.map((row, idx) => (
                        <div
                          key={row.id}
                          className="grid-row pg-pinned-row"
                          style={{
                            gridTemplateColumns: template,
                            top: `${HEADER_H + idx * PINNED_ROW_H}px`,
                          }}
                          data-pin-index={idx}
                        >
                          {ordered.map((col, i) => {
                            const frozenStyle: React.CSSProperties = col.frozen
                              ? { position: 'sticky', left: offsets[i], zIndex: 3 }
                              : {}
                            const isFirst = i === 0
                            return (
                              <div
                                key={col.key}
                                className={`cell pg-pinned-cell ${col.frozen ? 'cell-frozen' : ''} ${isFirst ? 'cell-with-pin' : ''}`}
                                style={frozenStyle}
                              >
                                {isFirst ? (
                                  <div className="pg-row-pin-wrap">
                                    <button
                                      type="button"
                                      className="pg-row-pin active"
                                      onClick={() => togglePinned(row.id)}
                                      aria-label="Unpin row"
                                      title="Unpin this row"
                                    >
                                      <PinIcon filled />
                                    </button>
                                    <span className="pg-row-pin-value">
                                      {renderCellValue(col, row)}
                                    </span>
                                  </div>
                                ) : (
                                  renderCellValue(col, row)
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  <Grid.Body>
                    <Row>
                      <div className="grid-row" style={{ gridTemplateColumns: template }}>
                        {ordered.map((col, i) => {
                          const isFirst = i === 0
                          const frozenCls = col.frozen ? 'cell-frozen' : ''
                          const className = `${frozenCls}${isFirst ? ' cell-with-pin' : ''}`
                          const style: React.CSSProperties = col.frozen
                            ? { position: 'sticky', left: offsets[i], zIndex: 1 }
                            : {}
                          const base = (value: any): React.ReactNode => {
                            if (col.key === 'salary') return `$${Number(value).toLocaleString()}`
                            if (col.key === 'status')
                              return (
                                <span className={`status-badge status-${value}`}>{String(value)}</span>
                              )
                            return String(value ?? '')
                          }
                          return (
                            <Cell
                              key={col.key}
                              columnKey={col.key}
                              className={className}
                              style={style}
                              overflow="ellipsis"
                              render={(value, ctx) => {
                                const content = base(value)
                                if (!isFirst) return content
                                return (
                                  <div className="pg-row-pin-wrap">
                                    <button
                                      type="button"
                                      className="pg-row-pin"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        togglePinned((ctx.row as Employee).id)
                                      }}
                                      aria-label="Pin row"
                                      title="Pin this row to the top"
                                    >
                                      <PinIcon filled={false} />
                                    </button>
                                    <span className="pg-row-pin-value">{content}</span>
                                  </div>
                                )
                              }}
                            />
                          )
                        })}
                      </div>
                    </Row>
                  </Grid.Body>
                  </div>
                </div>
                <div className="pg-bottom-bar">
                  {paginate ? <PaginationControls /> : <RowCount />}
                </div>
              </Grid>
            </div>
            <div className="playground-code">
              <CodeBlock code={code} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
