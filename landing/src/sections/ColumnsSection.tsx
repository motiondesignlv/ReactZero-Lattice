import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

// ──────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────
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

function ColumnsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}

// ──────────────────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────────────────
type ColumnDef = {
  key: string
  label: string
  group?: string
  width: number
  minWidth: number
  visible: boolean
  frozen: boolean
}

type CellRenderer = (key: string) => Partial<React.ComponentProps<typeof Cell>> | null

// ──────────────────────────────────────────────────────────
// Shared hook — one state model, reused by all three variants
// ──────────────────────────────────────────────────────────
function useColumns(initial: ColumnDef[]) {
  const initialRef = useRef(initial)
  const [columns, setColumns] = useState<ColumnDef[]>(initial)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  const toggleVisible = (key: string) =>
    setColumns((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
      if (next.filter((c) => c.visible).length === 0) return prev
      return next
    })

  const toggleFrozen = (key: string) =>
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, frozen: !c.frozen } : c)))

  const setWidth = (key: string, width: number) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.key === key ? { ...c, width: Math.max(c.minWidth, Math.min(480, width)) } : c,
      ),
    )

  const showAll = () => setColumns((prev) => prev.map((c) => ({ ...c, visible: true })))
  const hideAllExceptFirst = () =>
    setColumns((prev) => prev.map((c, i) => ({ ...c, visible: i === 0 })))
  const reset = () => setColumns(initialRef.current)

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

  // Reorder within same frozen-group (cross-group drops ignored).
  const reorder = (srcDisplayIdx: number, dstDisplayIdx: number) => {
    if (srcDisplayIdx === dstDisplayIdx) return
    const src = ordered[srcDisplayIdx]
    const dst = ordered[dstDisplayIdx]
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

  // Reorder using absolute indices into `columns` — used by the panel's drag-reorder.
  const reorderAbs = (src: number, dst: number) => {
    if (src === dst) return
    setColumns((prev) => {
      if (src < 0 || src >= prev.length || dst < 0 || dst >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(src, 1)
      next.splice(dst, 0, moved!)
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
    const move = (ev: PointerEvent) => setWidth(col.key, startW + (ev.clientX - startX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return {
    columns,
    setColumns,
    toggleVisible,
    toggleFrozen,
    reset,
    showAll,
    hideAllExceptFirst,
    reorder,
    reorderAbs,
    startResize,
    ordered,
    template,
    offsets,
    dragOverIdx,
    setDragOverIdx,
    dragSrcIdx,
  }
}

type ColumnsApi = ReturnType<typeof useColumns>

// ──────────────────────────────────────────────────────────
// Shared header-row renderer (in-header drag/freeze/resize)
// ──────────────────────────────────────────────────────────
function ColumnsHeader({ api }: { api: ColumnsApi }) {
  const {
    ordered,
    template,
    offsets,
    reorder,
    toggleFrozen,
    startResize,
    dragOverIdx,
    setDragOverIdx,
    dragSrcIdx,
  } = api
  return (
    <div className="grid-row header-row" style={{ gridTemplateColumns: template }}>
      {ordered.map((col, i) => {
        const isFrozen = col.frozen
        const frozenStyle: React.CSSProperties = isFrozen
          ? { position: 'sticky', left: offsets[i], zIndex: 3 }
          : {}
        const dropActive = dragOverIdx === i
        return (
          <div
            key={col.key}
            className={`cell header-cell ${isFrozen ? 'cell-frozen cell-frozen-head' : ''} ${
              dropActive ? 'drop-target' : ''
            }`}
            style={frozenStyle}
            onDragOver={(e) => {
              if (dragSrcIdx.current === null) return
              const src = ordered[dragSrcIdx.current]
              if (!src || src.frozen !== col.frozen) return
              e.preventDefault()
              setDragOverIdx(i)
            }}
            onDragLeave={() => setDragOverIdx((cur) => (cur === i ? null : cur))}
            onDrop={(e) => {
              e.preventDefault()
              const src = Number(e.dataTransfer.getData('text/plain'))
              setDragOverIdx(null)
              dragSrcIdx.current = null
              if (!Number.isNaN(src)) reorder(src, i)
            }}
          >
            <div
              className="header-drag-handle"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(i))
                e.dataTransfer.effectAllowed = 'move'
                dragSrcIdx.current = i
              }}
              onDragEnd={() => {
                dragSrcIdx.current = null
                setDragOverIdx(null)
              }}
              title="Drag to reorder"
            >
              <span className="header-drag-grip" aria-hidden>
                ⋮⋮
              </span>
              {col.label}
            </div>
            <button
              type="button"
              className={`freeze-btn ${isFrozen ? 'active' : ''}`}
              onClick={() => toggleFrozen(col.key)}
              aria-pressed={isFrozen}
              title={isFrozen ? 'Unfreeze column' : 'Freeze column'}
            >
              <PinIcon filled={isFrozen} />
            </button>
            <div
              className="resize-handle"
              onPointerDown={(e) => startResize(col, e)}
              title="Drag to resize"
            />
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Shared body-row renderer (Cells with optional per-key render)
// ──────────────────────────────────────────────────────────
function ColumnsRowContent({
  ordered,
  template,
  offsets,
  renderCell,
}: {
  ordered: ColumnDef[]
  template: string
  offsets: number[]
  renderCell?: CellRenderer
}) {
  return (
    <div className="grid-row" style={{ gridTemplateColumns: template }}>
      {ordered.map((col, i) => {
        const className = col.frozen ? 'cell-frozen' : ''
        const style: React.CSSProperties = col.frozen
          ? { position: 'sticky', left: offsets[i], zIndex: 1 }
          : {}
        const extra = renderCell?.(col.key) ?? {}
        return (
          <Cell
            key={col.key}
            columnKey={col.key as never}
            className={className}
            style={style}
            overflow="ellipsis"
            title
            {...extra}
          />
        )
      })}
    </div>
  )
}

const employeeCellRenderer: CellRenderer = (key) => {
  if (key === 'salary') return { render: (v) => `$${Number(v).toLocaleString()}` }
  if (key === 'status')
    return {
      render: (v) => <span className={`status-badge status-${v}`}>{String(v)}</span>,
    }
  return null
}

// ──────────────────────────────────────────────────────────
// Column picker panel — JS manages state; CSS handles every visual bit.
// ──────────────────────────────────────────────────────────
function ColumnPickerPanel({
  api,
  searchable = false,
  grouped = false,
}: {
  api: ColumnsApi
  searchable?: boolean
  grouped?: boolean
}) {
  const { columns, toggleVisible, toggleFrozen, reorderAbs, reset, showAll, hideAllExceptFirst } = api
  const [q, setQ] = useState('')
  const dragSrc = useRef<number | null>(null)

  const visibleCount = columns.filter((c) => c.visible).length
  const matches = (c: ColumnDef) => !q || c.label.toLowerCase().includes(q.toLowerCase())

  const groups = useMemo(() => {
    if (!grouped) return null
    const map = new Map<string, ColumnDef[]>()
    columns.forEach((c) => {
      const g = c.group ?? 'Other'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    })
    return Array.from(map.entries())
  }, [columns, grouped])

  const renderRow = (col: ColumnDef) => {
    const absIdx = columns.findIndex((c) => c.key === col.key)
    return (
      <div
        key={col.key}
        className="col-picker-row"
        data-hidden={!col.visible}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(absIdx))
          e.dataTransfer.effectAllowed = 'move'
          dragSrc.current = absIdx
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const src = Number(e.dataTransfer.getData('text/plain'))
          if (!Number.isNaN(src)) reorderAbs(src, absIdx)
          dragSrc.current = null
        }}
      >
        <span className="col-picker-grip" aria-hidden>
          ⋮⋮
        </span>
        <label className="col-picker-check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={col.visible}
            onChange={() => toggleVisible(col.key)}
            aria-label={`Toggle ${col.label}`}
          />
        </label>
        <span className="col-picker-label">{col.label}</span>
        <button
          type="button"
          className={`col-picker-pin ${col.frozen ? 'active' : ''}`}
          onClick={() => toggleFrozen(col.key)}
          aria-pressed={col.frozen}
          title={col.frozen ? 'Unfreeze' : 'Freeze'}
        >
          <PinIcon filled={col.frozen} />
        </button>
      </div>
    )
  }

  return (
    <div className="col-picker-panel" role="dialog" aria-label="Column picker">
      <div className="col-picker-head">
        <span className="col-picker-title">Columns</span>
        <span className="col-picker-count">
          {visibleCount} of {columns.length} visible
        </span>
      </div>

      {searchable && (
        <div className="col-picker-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search columns…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              className="col-picker-search-clear"
              onClick={() => setQ('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      <div className="col-picker-list">
        {groups ? (
          groups.map(([name, cols]) => {
            const filtered = cols.filter(matches)
            if (filtered.length === 0) return null
            const gVisible = cols.filter((c) => c.visible).length
            return (
              <details key={name} className="col-picker-group" open>
                <summary>
                  <span className="col-picker-group-name">{name}</span>
                  <span className="col-picker-group-count">
                    {gVisible}/{cols.length}
                  </span>
                </summary>
                <div className="col-picker-group-body">{filtered.map(renderRow)}</div>
              </details>
            )
          })
        ) : (
          <div className="col-picker-group-body">{columns.filter(matches).map(renderRow)}</div>
        )}
        {q && columns.filter(matches).length === 0 && (
          <div className="col-picker-empty">No columns match “{q}”.</div>
        )}
      </div>

      <div className="col-picker-foot">
        <button type="button" className="col-picker-action" onClick={showAll}>
          Show all
        </button>
        <button type="button" className="col-picker-action" onClick={hideAllExceptFirst}>
          Hide all
        </button>
        <button
          type="button"
          className="col-picker-action col-picker-action-muted"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Outside-click / Escape handler for popovers
// ──────────────────────────────────────────────────────────
function useDismiss(
  open: boolean,
  close: () => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, ref])
}

// ──────────────────────────────────────────────────────────
// Variant A — Chip toolbar (the original pattern)
// ──────────────────────────────────────────────────────────
const initialColumnsA: ColumnDef[] = [
  { key: 'name', label: 'Name', width: 180, minWidth: 120, visible: true, frozen: true },
  { key: 'department', label: 'Department', width: 150, minWidth: 100, visible: true, frozen: false },
  { key: 'role', label: 'Role', width: 200, minWidth: 120, visible: true, frozen: false },
  { key: 'email', label: 'Email', width: 220, minWidth: 140, visible: false, frozen: false },
  { key: 'salary', label: 'Salary', width: 140, minWidth: 100, visible: true, frozen: false },
  { key: 'startDate', label: 'Start date', width: 140, minWidth: 100, visible: false, frozen: false },
  { key: 'status', label: 'Status', width: 130, minWidth: 90, visible: true, frozen: false },
]

function VariantA() {
  const api = useColumns(initialColumnsA)
  const { columns, toggleVisible, reset, ordered, template, offsets } = api
  return (
    <ExampleCard
      title="A · Chip toolbar"
      description="Chips above the grid toggle visibility. Scannable and obvious — best when users want every option one click away."
      code={codeA}
    >
      <div className="columns-toolbar">
        <div className="columns-toolbar-label">Show columns</div>
        <div className="columns-chip-row">
          {columns.map((col) => (
            <button
              key={col.key}
              type="button"
              className={`columns-chip ${col.visible ? 'active' : ''}`}
              onClick={() => toggleVisible(col.key)}
            >
              {col.visible ? '✓' : '+'} {col.label}
            </button>
          ))}
          <button className="clear-btn columns-reset" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className="columns-scroll">
        <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Chip toolbar grid">
          <Grid.Header>
            <ColumnsHeader api={api} />
          </Grid.Header>
          <Grid.Body>
            <Row>
              <ColumnsRowContent
                ordered={ordered}
                template={template}
                offsets={offsets}
                renderCell={employeeCellRenderer}
              />
            </Row>
          </Grid.Body>
        </Grid>
      </div>
    </ExampleCard>
  )
}

// ──────────────────────────────────────────────────────────
// Variant B — Embedded header picker (the flagship)
// ──────────────────────────────────────────────────────────
function VariantB() {
  const api = useColumns(initialColumnsA)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), wrapRef)

  const visibleCount = api.columns.filter((c) => c.visible).length
  return (
    <ExampleCard
      title="B · Embedded picker"
      description="A quiet icon in the grid chrome opens a CSS-animated popover. Perfect for dense UIs where every pixel counts."
      code={codeB}
    >
      <div className="grid-card">
        <div className="grid-card-header">
          <span className="grid-card-title">
            Employees · {visibleCount} of {api.columns.length} columns
          </span>
          <div className="col-picker-wrap" data-open={open} ref={wrapRef}>
            <button
              type="button"
              className={`col-picker-trigger ${open ? 'active' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-label="Open column picker"
              aria-expanded={open}
              title="Columns"
            >
              <ColumnsIcon />
            </button>
            <ColumnPickerPanel api={api} />
          </div>
        </div>

        <div className="columns-scroll">
          <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Embedded picker grid">
            <Grid.Header>
              <ColumnsHeader api={api} />
            </Grid.Header>
            <Grid.Body>
              <Row>
                <ColumnsRowContent
                  ordered={api.ordered}
                  template={api.template}
                  offsets={api.offsets}
                  renderCell={employeeCellRenderer}
                />
              </Row>
            </Grid.Body>
          </Grid>
        </div>
      </div>
    </ExampleCard>
  )
}

// ──────────────────────────────────────────────────────────
// Variant C — At scale: 22 columns, search + groups
// ──────────────────────────────────────────────────────────
type WideEmployee = Employee & {
  phone: string
  location: string
  manager: string
  team: string
  level: string
  tenure: string
  lastReview: string
  bonus: number
  equity: string
  employmentType: string
  office: string
  timezone: string
  pronouns: string
  skills: string
}

const wideEmployees: WideEmployee[] = employees.slice(0, 10).map((e, i) => ({
  ...e,
  phone: `+1 555-01${String(i + 10).padStart(2, '0')}`,
  location: ['New York', 'San Francisco', 'Austin', 'Remote', 'Berlin', 'London'][i % 6]!,
  manager: ['Priya Patel', 'Alex Kim', 'Jordan Reed', 'Sam Ortiz'][i % 4]!,
  team: ['Platform', 'Growth', 'Insights', 'Infra', 'Brand'][i % 5]!,
  level: ['L3', 'L4', 'L5', 'L6', 'Staff', 'Principal'][i % 6]!,
  tenure: `${2 + (i % 6)}y ${i % 12}m`,
  lastReview: `2025-${String(1 + (i % 9)).padStart(2, '0')}-15`,
  bonus: 5000 + ((i * 1234) % 20000),
  equity: `${(0.01 + i * 0.003).toFixed(3)}%`,
  employmentType: ['Full-time', 'Contract', 'Intern'][i % 3]!,
  office: ['HQ', 'Remote', 'Satellite'][i % 3]!,
  timezone: ['PT', 'ET', 'CET', 'UTC'][i % 4]!,
  pronouns: ['she/her', 'he/him', 'they/them'][i % 3]!,
  skills: ['React, TS', 'Go, k8s', 'Figma, UX', 'SQL, Python'][i % 4]!,
}))

const initialColumnsC: ColumnDef[] = [
  // Identity
  { key: 'name', label: 'Name', group: 'Identity', width: 180, minWidth: 120, visible: true, frozen: true },
  { key: 'pronouns', label: 'Pronouns', group: 'Identity', width: 110, minWidth: 80, visible: false, frozen: false },
  { key: 'email', label: 'Email', group: 'Identity', width: 220, minWidth: 140, visible: true, frozen: false },
  { key: 'phone', label: 'Phone', group: 'Identity', width: 150, minWidth: 110, visible: false, frozen: false },
  // Employment
  { key: 'department', label: 'Department', group: 'Employment', width: 150, minWidth: 100, visible: true, frozen: false },
  { key: 'team', label: 'Team', group: 'Employment', width: 130, minWidth: 90, visible: false, frozen: false },
  { key: 'role', label: 'Role', group: 'Employment', width: 200, minWidth: 120, visible: true, frozen: false },
  { key: 'level', label: 'Level', group: 'Employment', width: 90, minWidth: 60, visible: false, frozen: false },
  { key: 'manager', label: 'Manager', group: 'Employment', width: 150, minWidth: 100, visible: false, frozen: false },
  { key: 'employmentType', label: 'Type', group: 'Employment', width: 110, minWidth: 80, visible: false, frozen: false },
  { key: 'status', label: 'Status', group: 'Employment', width: 130, minWidth: 90, visible: true, frozen: false },
  // Location
  { key: 'location', label: 'Location', group: 'Location', width: 140, minWidth: 100, visible: false, frozen: false },
  { key: 'office', label: 'Office', group: 'Location', width: 110, minWidth: 80, visible: false, frozen: false },
  { key: 'timezone', label: 'Timezone', group: 'Location', width: 100, minWidth: 70, visible: false, frozen: false },
  // Compensation
  { key: 'salary', label: 'Salary', group: 'Compensation', width: 140, minWidth: 100, visible: true, frozen: false },
  { key: 'bonus', label: 'Bonus', group: 'Compensation', width: 120, minWidth: 90, visible: false, frozen: false },
  { key: 'equity', label: 'Equity', group: 'Compensation', width: 100, minWidth: 80, visible: false, frozen: false },
  // Timeline
  { key: 'startDate', label: 'Start date', group: 'Timeline', width: 140, minWidth: 100, visible: false, frozen: false },
  { key: 'tenure', label: 'Tenure', group: 'Timeline', width: 100, minWidth: 80, visible: false, frozen: false },
  { key: 'lastReview', label: 'Last review', group: 'Timeline', width: 140, minWidth: 100, visible: false, frozen: false },
  // Meta
  { key: 'skills', label: 'Skills', group: 'Meta', width: 180, minWidth: 120, visible: false, frozen: false },
  { key: 'id', label: 'ID', group: 'Meta', width: 70, minWidth: 50, visible: false, frozen: false },
]

const wideCellRenderer: CellRenderer = (key) => {
  if (key === 'salary' || key === 'bonus')
    return { render: (v) => `$${Number(v).toLocaleString()}` }
  if (key === 'status')
    return {
      render: (v) => <span className={`status-badge status-${v}`}>{String(v)}</span>,
    }
  return null
}

function VariantC() {
  const api = useColumns(initialColumnsC)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), wrapRef)

  const visibleCount = api.columns.filter((c) => c.visible).length
  return (
    <ExampleCard
      title="C · At scale — search, groups, 22 columns"
      description="When columns multiply, give users a map. <details> handles expand/collapse, a single string filter drives search, the grid scrolls horizontally with Name pinned."
      code={codeC}
    >
      <div className="grid-card">
        <div className="grid-card-header">
          <span className="grid-card-title">
            All fields · {visibleCount} of {api.columns.length} visible
          </span>
          <div className="col-picker-wrap" data-open={open} ref={wrapRef}>
            <button
              type="button"
              className={`col-picker-trigger ${open ? 'active' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-label="Open column picker"
              aria-expanded={open}
              title="Columns"
            >
              <ColumnsIcon />
            </button>
            <ColumnPickerPanel api={api} searchable grouped />
          </div>
        </div>

        <div className="columns-scroll">
          <Grid data={wideEmployees} rowKey="id" aria-label="At-scale grid">
            <Grid.Header>
              <ColumnsHeader api={api} />
            </Grid.Header>
            <Grid.Body>
              <Row>
                <ColumnsRowContent
                  ordered={api.ordered}
                  template={api.template}
                  offsets={api.offsets}
                  renderCell={wideCellRenderer}
                />
              </Row>
            </Grid.Body>
          </Grid>
        </div>
      </div>
    </ExampleCard>
  )
}

// ──────────────────────────────────────────────────────────
// Code snippets (shown in each card's "View code")
// ──────────────────────────────────────────────────────────
const codeA = `// Chip toolbar — chips above the grid toggle \`visible\`.
<div className="columns-toolbar">
  {columns.map((col) => (
    <button
      className={\`columns-chip \${col.visible ? 'active' : ''}\`}
      onClick={() => toggleVisible(col.key)}
    >
      {col.visible ? '✓' : '+'} {col.label}
    </button>
  ))}
</div>`

const codeB = `// Embedded picker — a 4-box icon in the grid chrome opens a
// CSS-animated popover. Zero animation libraries, no portals.
<div className="col-picker-wrap" data-open={open}>
  <button className="col-picker-trigger" onClick={() => setOpen(v => !v)}>
    <ColumnsIcon />
  </button>
  <div className="col-picker-panel">
    {columns.map((col) => (
      <label className="col-picker-row">
        <input type="checkbox" checked={col.visible}
               onChange={() => toggleVisible(col.key)} />
        {col.label}
      </label>
    ))}
  </div>
</div>

/* CSS is what makes it feel alive */
.col-picker-panel {
  opacity: 0; transform: translateY(-4px); pointer-events: none;
  transition: opacity .15s, transform .15s;
}
.col-picker-wrap[data-open="true"] .col-picker-panel {
  opacity: 1; transform: none; pointer-events: auto;
}`

const codeC = `// At scale — 22 columns, five groups, live search.
// Native <details>/<summary> handles expand/collapse.
<input value={q} onChange={(e) => setQ(e.target.value)}
       placeholder="Search columns…" />

{groups.map(([name, cols]) => (
  <details key={name} open>
    <summary>
      {name}
      <span>{cols.filter(c => c.visible).length}/{cols.length}</span>
    </summary>
    {cols
      .filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
      .map((col) => <ColumnRow col={col} />)}
  </details>
))}`

// ──────────────────────────────────────────────────────────
// Section
// ──────────────────────────────────────────────────────────
export function ColumnsSection() {
  return (
    <section className="section" id="columns">
      <div className="container">
        <div className="section-label">Columns</div>
        <h2 className="section-title">Pick, drag, resize, and freeze — right on the header</h2>
        <p className="section-desc">
          Everything lives in one <code>ColumnDef[]</code> state — visibility, order, width,
          and frozen status. That single shape drives three distinct picker UXes below:
          a chip toolbar, an embedded icon popover, and a searchable grouped panel for when
          you have many, many columns. It&rsquo;s React state and CSS grid all the way down —
          no virtualization, no drag libraries, no portals.
        </p>

        <VariantA />
        <VariantB />
        <VariantC />
      </div>
    </section>
  )
}
