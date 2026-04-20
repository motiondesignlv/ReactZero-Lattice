import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { employees, type Employee } from '../../data/sampleData'
import { FakeCursor, type CursorState } from './FakeCursor'
import { useReducedMotion } from './useReducedMotion'
import { tweenValue, easePowerOut, type Tween } from './interpolate'

type ColKey = 'name' | 'department' | 'role' | 'salary' | 'status'

type Column = {
  key: ColKey
  label: string
  width: number
  minWidth: number
  visible: boolean
  frozen: boolean
}

const INITIAL_COLUMNS: Column[] = [
  { key: 'name', label: 'Name', width: 160, minWidth: 120, visible: true, frozen: false },
  { key: 'department', label: 'Department', width: 140, minWidth: 100, visible: true, frozen: false },
  { key: 'role', label: 'Role', width: 180, minWidth: 110, visible: true, frozen: false },
  { key: 'salary', label: 'Salary', width: 130, minWidth: 90, visible: true, frozen: false },
  { key: 'status', label: 'Status', width: 110, minWidth: 90, visible: true, frozen: false },
]

const DATA: Employee[] = employees.slice(0, 6)
const HEADER_H = 40
const PINNED_ROW_H = 44
const COL_VAR = (key: ColKey) => `--col-w-${key}`

const PinIcon = ({ filled }: { filled: boolean }) => (
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

export function HeroShowcase() {
  return (
    <div className="hero-showcase-outer">
      <HeroShowcaseInner />
    </div>
  )
}

function HeroShowcaseInner() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => new Set())
  const [rich, setRich] = useState(false)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [striped, setStriped] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [caption, setCaption] = useState<string>('Lattice in action')
  const [captionKey, setCaptionKey] = useState(0)
  const [cursor, setCursor] = useState<{ x: number; y: number; state: CursorState; pulse: number }>({
    x: 0, y: 0, state: 'hidden', pulse: 0,
  })
  const [paused, setPaused] = useState(false)

  const reduced = useReducedMotion()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const userTouchedRef = useRef(false)
  const activeTweenRef = useRef<Tween | null>(null)
  const leaveTimerRef = useRef<number | null>(null)

  useEffect(() => { pausedRef.current = paused }, [paused])

  // Track latest columns in a ref so user handlers (drag, resize) can read
  // current widths/order without closing over stale state.
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const plugins = useMemo(
    () => [
      sortPlugin<Employee>({ multiSort: false }),
      filterPlugin<Employee>({ debounce: 0 }),
    ],
    [],
  )

  const { ordered, template, offsets } = useMemo(() => {
    const visible = columns.filter((c) => c.visible)
    const frozen = visible.filter((c) => c.frozen)
    const scroll = visible.filter((c) => !c.frozen)
    const ordered = [...frozen, ...scroll]
    // Drive layout via CSS variables so per-frame width tweens can update
    // the DOM directly without re-rendering React (see setColumnWidth).
    const template = ordered.map((c) => `var(${COL_VAR(c.key)})`).join(' ')
    const offsets = ordered.map((_c, i) =>
      ordered.slice(0, i).reduce((sum, c) => sum + (c.frozen ? c.width : 0), 0),
    )
    return { ordered, template, offsets }
  }, [columns])

  // Sync each column's width into a CSS variable on the wrapper. React
  // owns this on render; tweens/drag write the variable directly between
  // renders; the next state-driven render reapplies the same value, so
  // there is no flicker.
  const widthStyle = useMemo(() => {
    const s: Record<string, string> = {}
    columns.forEach((c) => { s[COL_VAR(c.key)] = `${c.width}px` })
    return s as React.CSSProperties
  }, [columns])

  const markUserTouched = useCallback(() => {
    userTouchedRef.current = true
  }, [])

  // Direct-DOM width writer — no React render. Used by both the auto
  // tween and the user resize drag.
  const setColumnWidthLive = useCallback((key: ColKey, w: number) => {
    const wrap = wrapperRef.current
    if (!wrap) return
    wrap.style.setProperty(COL_VAR(key), `${w}px`)
  }, [])

  // Commit live width back into React state (e.g. on tween/drag end).
  const commitColumnWidth = useCallback((key: ColKey, w: number) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, width: w } : c)))
  }, [])

  const cancelActiveTween = useCallback(() => {
    activeTweenRef.current?.cancel()
    activeTweenRef.current = null
  }, [])

  // ── User actions (only fire when paused) ─────────────────────────────

  const userToggleFrozen = useCallback((key: ColKey) => {
    cancelActiveTween()
    markUserTouched()
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, frozen: !c.frozen } : c)))
  }, [cancelActiveTween, markUserTouched])

  const userTogglePinnedRow = useCallback((id: number) => {
    cancelActiveTween()
    markUserTouched()
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [cancelActiveTween, markUserTouched])

  const userMoveColumn = useCallback((from: ColKey, to: ColKey) => {
    if (from === to) return
    cancelActiveTween()
    markUserTouched()
    setColumns((prev) => {
      const fromCol = prev.find((c) => c.key === from)
      const toCol = prev.find((c) => c.key === to)
      if (!fromCol || !toCol || fromCol.frozen !== toCol.frozen) return prev
      const next = [...prev]
      const a = next.findIndex((c) => c.key === from)
      const b = next.findIndex((c) => c.key === to)
      const [moved] = next.splice(a, 1)
      next.splice(b, 0, moved!)
      return next
    })
  }, [cancelActiveTween, markUserTouched])

  // ── Pause / resume wiring ────────────────────────────────────────────

  const pause = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    cancelActiveTween()
    setPaused(true)
  }, [cancelActiveTween])

  const scheduleResume = useCallback(() => {
    if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
    leaveTimerRef.current = window.setTimeout(() => {
      leaveTimerRef.current = null
      // Only reset if the user actually changed something. Pure hovers
      // shouldn't blow away the demo's progress.
      if (userTouchedRef.current) {
        userTouchedRef.current = false
        setColumns(INITIAL_COLUMNS)
        setPinnedIds(new Set())
        setRich(false)
        setDensity('comfortable')
        setStriped(false)
        setSearchValue('')
      }
      setPaused(false)
    }, 600)
  }, [])

  useEffect(() => () => {
    if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
  }, [])

  // Driver setters bundle (stable identity).
  const apiRef = useRef({
    setColumns, setPinnedIds, setRich, setDensity, setStriped,
    setSearchValue, setCaption, setCaptionKey, setCursor,
    setColumnWidthLive, commitColumnWidth,
    activeTweenRef,
    pausedRef,
  })
  apiRef.current = {
    setColumns, setPinnedIds, setRich, setDensity, setStriped,
    setSearchValue, setCaption, setCaptionKey, setCursor,
    setColumnWidthLive, commitColumnWidth,
    activeTweenRef,
    pausedRef,
  }

  return (
    <div
      ref={wrapperRef}
      className="hero-showcase"
      data-density={density}
      data-striped={striped ? 'true' : 'false'}
      data-reduced={reduced ? 'true' : 'false'}
      data-paused={paused ? 'true' : 'false'}
      role="region"
      aria-label="Lattice feature showcase"
      style={widthStyle}
      onMouseEnter={pause}
      onMouseLeave={scheduleResume}
      onFocus={pause}
      onBlur={scheduleResume}
    >
      <div className="hero-caption" aria-live="polite">
        <span key={captionKey} className="hero-caption-text">{caption}</span>
        {paused && <span className="hero-caption-paused">paused — try interacting</span>}
      </div>

      <Grid
        data={DATA.filter((r) => !pinnedIds.has(r.id))}
        rowKey="id"
        plugins={plugins}
        aria-label="Hero preview grid"
      >
        <ShowcaseDriver
          wrapperRef={wrapperRef}
          pausedRef={pausedRef}
          reduced={reduced}
          api={apiRef}
        />

        <HeroToolbar
          searchValue={searchValue}
          onSearchChange={(v) => {
            markUserTouched()
            setSearchValue(v)
          }}
        />

        <div className="pg-scroll hero-pg-scroll">
          <div className="pg-scroll-content">
            <Grid.Header>
              <div
                className="grid-row header-row pg-header"
                style={{ gridTemplateColumns: template }}
                data-hero-target="header-row"
              >
                {ordered.map((col, i) => (
                  <HeaderCell
                    key={col.key}
                    col={col}
                    sticky={col.frozen ? (offsets[i] ?? 0) : null}
                    paused={paused}
                    onPin={userToggleFrozen}
                    onResizeStart={(startX) => beginUserResize(col.key, startX, columnsRef, setColumnWidthLive, commitColumnWidth, markUserTouched, cancelActiveTween)}
                    onMoveColumn={userMoveColumn}
                  />
                ))}
              </div>
            </Grid.Header>

            {pinnedIds.size > 0 && (
              <div className="pg-pinned" aria-label="Pinned rows">
                {DATA.filter((r) => pinnedIds.has(r.id)).map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid-row pg-pinned-row"
                    style={{
                      gridTemplateColumns: template,
                      top: `${HEADER_H + idx * PINNED_ROW_H}px`,
                    }}
                  >
                    {ordered.map((col, i) => {
                      const isFirst = i === 0
                      const frozenStyle: React.CSSProperties = col.frozen
                        ? { position: 'sticky', left: offsets[i], zIndex: 3 }
                        : {}
                      const content = renderCellContent(col, row, rich, true)
                      return (
                        <div
                          key={col.key}
                          className={`cell pg-pinned-cell ${col.frozen ? 'cell-frozen' : ''}`}
                          style={frozenStyle}
                        >
                          {isFirst ? (
                            <div className="pg-row-pin-wrap">
                              <button
                                type="button"
                                className="pg-row-pin active"
                                aria-label={`Unpin ${row.name}`}
                                aria-pressed="true"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  userTogglePinnedRow(row.id)
                                }}
                              >
                                <PinIcon filled />
                              </button>
                              <span className="pg-row-pin-value">{content}</span>
                            </div>
                          ) : content}
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
                    return (
                      <Cell
                        key={col.key + (rich ? '-rich' : '')}
                        columnKey={col.key}
                        className={className}
                        style={style}
                        overflow="ellipsis"
                        render={(_value, ctx) => {
                          const row = ctx.row as Employee
                          const content = renderCellContent(col, row, rich, false)
                          if (!isFirst) return content
                          const isPinned = pinnedIds.has(row.id)
                          return (
                            <div
                              className="pg-row-pin-wrap"
                              data-hero-target={`row-${row.id}`}
                            >
                              <button
                                type="button"
                                className={`pg-row-pin${isPinned ? ' active' : ''}`}
                                aria-label={isPinned ? `Unpin ${row.name}` : `Pin ${row.name}`}
                                aria-pressed={isPinned}
                                data-hero-target={`pin-row-${row.id}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  userTogglePinnedRow(row.id)
                                }}
                              >
                                <PinIcon filled={isPinned} />
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
      </Grid>

      <FakeCursor x={cursor.x} y={cursor.y} state={cursor.state} clickPulseKey={cursor.pulse} />
    </div>
  )
}

// ── Header cell with sort / pin / drag-reorder / resize wiring ─────────

type HeaderCellProps = {
  col: Column
  sticky: number | null
  paused: boolean
  onPin: (key: ColKey) => void
  onResizeStart: (startX: number) => void
  onMoveColumn: (from: ColKey, to: ColKey) => void
}

function HeaderCell({ col, sticky, paused, onPin, onResizeStart, onMoveColumn }: HeaderCellProps) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(col.key)
  const cellRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const stickyStyle: React.CSSProperties = sticky !== null
    ? { position: 'sticky', left: sticky, zIndex: 5 }
    : {}

  return (
    <div
      ref={cellRef}
      className={`cell header-cell ${col.frozen ? 'cell-frozen cell-frozen-head' : ''}`}
      style={stickyStyle}
      data-hero-target={`header-${col.key}`}
      onDragOver={(e) => {
        if (!paused) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        cellRef.current?.classList.add('drop-target')
      }}
      onDragLeave={() => {
        cellRef.current?.classList.remove('drop-target')
      }}
      onDrop={(e) => {
        cellRef.current?.classList.remove('drop-target')
        if (!paused) return
        const from = e.dataTransfer.getData('text/x-col') as ColKey
        if (!from) return
        e.preventDefault()
        onMoveColumn(from, col.key)
      }}
    >
      <div
        className="header-drag-handle"
        draggable={paused}
        aria-label={col.label}
        onDragStart={(e) => {
          if (!paused) {
            e.preventDefault()
            return
          }
          draggingRef.current = true
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/x-col', col.key)
        }}
        onDragEnd={() => {
          draggingRef.current = false
        }}
        onClick={() => {
          // HTML5 DnD does not fire click after a successful drag — but
          // guard anyway in case of stray events.
          if (!paused || draggingRef.current) return
          sort.toggleSort(col.key)
        }}
      >
        <span className="header-drag-grip" aria-hidden>⋮⋮</span>
        <span className="header-drag-label">{col.label}</span>
        <span className="sort-indicator">
          {dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}
        </span>
      </div>
      <button
        type="button"
        className={`freeze-btn ${col.frozen ? 'active' : ''}`}
        aria-label={col.frozen ? `Unpin column ${col.label}` : `Pin column ${col.label}`}
        aria-pressed={col.frozen}
        data-hero-target={`pin-${col.key}`}
        disabled={!paused}
        onClick={(e) => {
          e.stopPropagation()
          if (!paused) return
          onPin(col.key)
        }}
      >
        <PinIcon filled={col.frozen} />
      </button>
      <span
        className="resize-handle"
        data-hero-target={`resize-${col.key}`}
        aria-hidden="true"
        onPointerDown={(e) => {
          if (!paused) return
          e.preventDefault()
          ;(e.target as Element).setPointerCapture(e.pointerId)
          onResizeStart(e.clientX)
        }}
      />
    </div>
  )
}

// ── User-driven resize: writes CSS variable directly during pointermove,
//    commits to React state on release. Mirrors the auto tween path so
//    layout cost is identical. ────────────────────────────────────────
function beginUserResize(
  key: ColKey,
  startX: number,
  columnsRef: { current: Column[] },
  setLive: (key: ColKey, w: number) => void,
  commit: (key: ColKey, w: number) => void,
  markUserTouched: () => void,
  cancelActiveTween: () => void,
) {
  cancelActiveTween()
  markUserTouched()
  const col = columnsRef.current.find((c) => c.key === key)
  if (!col) return
  const startW = col.width
  let lastW = startW

  const onMove = (e: PointerEvent) => {
    const delta = e.clientX - startX
    const next = Math.max(col.minWidth, startW + delta)
    lastW = next
    setLive(key, next)
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    commit(key, lastW)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

// ── Toolbar with real search input — lives inside <Grid> so it can use
//    the filter plugin. ───────────────────────────────────────────────
function HeroToolbar({
  searchValue,
  onSearchChange,
}: {
  searchValue: string
  onSearchChange: (v: string) => void
}) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')

  return (
    <div className="hero-toolbar" data-hero-target="toolbar">
      <div className="hero-search" data-hero-target="search">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          className="hero-search-input"
          type="search"
          aria-label="Search rows"
          placeholder="Search…"
          value={searchValue}
          onChange={(e) => {
            const v = e.target.value
            onSearchChange(v)
            if (v) filter.setGlobalFilter(v)
            else filter.clearFilters()
          }}
        />
      </div>
    </div>
  )
}

function renderCellContent(col: Column, row: Employee, rich: boolean, pinned: boolean): React.ReactNode {
  const v = (row as unknown as Record<string, unknown>)[col.key]
  if (col.key === 'salary') {
    if (rich) {
      const bonus = Math.round(Number(v) * 0.1)
      const pct = Math.min(100, Math.round(Number(v) / 1600))
      return (
        <div className="rich-salary">
          <span className="rich-salary-amount">${Number(v).toLocaleString()}</span>
          <span className="rich-salary-bonus">+ ${bonus.toLocaleString()} bonus</span>
          <span className="rich-salary-bar"><span style={{ width: `${pct}%` }} /></span>
        </div>
      )
    }
    return `$${Number(v).toLocaleString()}`
  }
  if (col.key === 'status') {
    return <span className={`status-badge status-${v}`}>{String(v)}</span>
  }
  if (col.key === 'name' && rich && !pinned) {
    const initials = String(row.name).split(' ').map((n) => n[0]).slice(0, 2).join('')
    return (
      <div className="rich-name">
        <span className="rich-avatar" aria-hidden="true">{initials}</span>
        <span className="rich-name-text">
          <span className="rich-name-primary">{row.name}</span>
          <span className="rich-name-secondary">{row.email}</span>
        </span>
      </div>
    )
  }
  return String(v ?? '')
}

// ── driver ─────────────────────────────────────────────────────────────

type DriverProps = {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  pausedRef: React.RefObject<boolean>
  reduced: boolean
  api: React.RefObject<{
    setColumns: React.Dispatch<React.SetStateAction<Column[]>>
    setPinnedIds: React.Dispatch<React.SetStateAction<Set<number>>>
    setRich: React.Dispatch<React.SetStateAction<boolean>>
    setDensity: React.Dispatch<React.SetStateAction<'comfortable' | 'compact'>>
    setStriped: React.Dispatch<React.SetStateAction<boolean>>
    setSearchValue: React.Dispatch<React.SetStateAction<string>>
    setCaption: React.Dispatch<React.SetStateAction<string>>
    setCaptionKey: React.Dispatch<React.SetStateAction<number>>
    setCursor: React.Dispatch<React.SetStateAction<{ x: number; y: number; state: CursorState; pulse: number }>>
    setColumnWidthLive: (key: ColKey, w: number) => void
    commitColumnWidth: (key: ColKey, w: number) => void
    activeTweenRef: { current: Tween | null }
    pausedRef: React.RefObject<boolean>
  }>
}

function ShowcaseDriver({ wrapperRef, pausedRef, reduced, api }: DriverProps) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')

  const sortRef = useRef(sort)
  const filterRef = useRef(filter)
  sortRef.current = sort
  filterRef.current = filter

  useEffect(() => {
    let cancelled = false

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve()
        const start = performance.now()
        const check = () => {
          if (cancelled) return resolve()
          if (pausedRef.current) {
            requestAnimationFrame(check)
            return
          }
          const elapsed = performance.now() - start
          if (elapsed >= ms) return resolve()
          requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })

    // Wait until pause clears before performing a state mutation. Without
    // this, a pause that lands between sleeps still lets the next
    // statement fire and overwrite user-changed state.
    const guard = async () => {
      while (!cancelled && pausedRef.current) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
      }
    }

    const cap = (text: string) => {
      if (cancelled || pausedRef.current) return
      api.current.setCaption(text)
      api.current.setCaptionKey((k) => k + 1)
    }

    const getTargetPos = (
      selector: string,
      anchor: 'center' | 'left-edge' | 'right-edge' = 'center',
    ): { x: number; y: number } | null => {
      const wrap = wrapperRef.current
      if (!wrap) return null
      const el = wrap.querySelector(selector) as HTMLElement | null
      if (!el) return null
      const er = el.getBoundingClientRect()
      const wr = wrap.getBoundingClientRect()
      const y = er.top - wr.top + er.height / 2
      let x: number
      if (anchor === 'left-edge') x = er.left - wr.left + 2
      else if (anchor === 'right-edge') x = er.right - wr.left - 2
      else x = er.left - wr.left + er.width / 2
      return { x, y }
    }

    const moveCursorTo = async (
      selector: string,
      opts: { anchor?: 'center' | 'left-edge' | 'right-edge'; settle?: number } = {},
    ) => {
      if (reduced) return
      const pos = getTargetPos(selector, opts.anchor ?? 'center')
      if (!pos) return
      api.current.setCursor((c) => ({ ...c, x: pos.x, y: pos.y, state: 'idle' }))
      await sleep(opts.settle ?? 640)
    }

    const click = async () => {
      if (reduced) return
      api.current.setCursor((c) => ({ ...c, state: 'pressing', pulse: c.pulse + 1 }))
      await sleep(140)
      api.current.setCursor((c) => ({ ...c, state: 'idle' }))
      await sleep(100)
    }

    const hideCursor = () => {
      api.current.setCursor((c) => ({ ...c, state: 'hidden' }))
    }

    const setInitialState = () => {
      api.current.setColumns(INITIAL_COLUMNS)
      api.current.setPinnedIds(new Set())
      api.current.setRich(false)
      api.current.setDensity('comfortable')
      api.current.setStriped(false)
      api.current.setSearchValue('')
      filterRef.current.clearFilters()
      sortRef.current.clearSort()
    }

    // Animate a column's width by writing the CSS variable directly each
    // RAF frame — no React state writes during the tween. Commits the
    // final value to React state on completion so the next render is
    // consistent.
    const tweenWidth = async (key: ColKey, to: number, duration: number) => {
      if (reduced) {
        api.current.setColumnWidthLive(key, to)
        api.current.commitColumnWidth(key, to)
        return
      }
      const wrap = wrapperRef.current
      const fromStr = wrap ? getComputedStyle(wrap).getPropertyValue(`--col-w-${key}`).trim() : ''
      const from = parseFloat(fromStr) || to
      await new Promise<void>((resolve) => {
        const t = tweenValue(from, to, duration, easePowerOut, (v) => {
          api.current.setColumnWidthLive(key, v)
        })
        api.current.activeTweenRef.current = t
        t.done.then(() => {
          if (api.current.activeTweenRef.current === t) {
            api.current.activeTweenRef.current = null
          }
          resolve()
        })
      })
      // Commit to React state only if not cancelled by pause.
      if (!cancelled && !pausedRef.current) {
        api.current.commitColumnWidth(key, to)
      }
    }

    const dwell = reduced ? 1.8 : 1.0

    const runSequence = async () => {
      while (!cancelled) {
        await guard()
        if (cancelled) return
        setInitialState()
        await sleep(600 * dwell)

        // 1 — Sort
        cap('Sort columns')
        await moveCursorTo('[data-hero-target="header-salary"]')
        if (cancelled) return
        await click()
        await guard()
        sortRef.current.setSortBy('salary', 'desc')
        await sleep(1400 * dwell)

        // 2 — Filter (typing)
        cap('Filter rows')
        await moveCursorTo('[data-hero-target="search"]', { anchor: 'left-edge' })
        if (cancelled) return
        await click()
        const query = 'eng'
        for (let i = 1; i <= query.length; i++) {
          if (cancelled) return
          await guard()
          const partial = query.slice(0, i)
          api.current.setSearchValue(partial)
          filterRef.current.setGlobalFilter(partial)
          await sleep(reduced ? 200 : 160)
        }
        await sleep(1400 * dwell)
        await guard()
        api.current.setSearchValue('')
        filterRef.current.clearFilters()
        sortRef.current.clearSort()
        await sleep(300)

        // 3 — Resize (smooth, via CSS variable)
        cap('Resize columns')
        await moveCursorTo('[data-hero-target="resize-role"]', { anchor: 'right-edge' })
        if (cancelled) return
        api.current.setCursor((c) => ({ ...c, state: 'dragging', pulse: c.pulse + 1 }))
        await tweenWidth('role', 260, 520)
        if (cancelled) return
        await tweenWidth('role', 140, 480)
        if (cancelled) return
        api.current.setCursor((c) => ({ ...c, state: 'idle' }))
        await sleep(700 * dwell)
        await tweenWidth('role', 180, 320)

        // 4 — Pin column
        cap('Pin a column')
        await moveCursorTo('[data-hero-target="pin-department"]')
        if (cancelled) return
        await click()
        await guard()
        api.current.setColumns((prev) =>
          prev.map((c) => (c.key === 'department' ? { ...c, frozen: true } : c)),
        )
        await sleep(1500 * dwell)

        // 5 — Reorder (unfrozen)
        cap('Reorder columns')
        await moveCursorTo('[data-hero-target="header-status"]')
        if (cancelled) return
        api.current.setCursor((c) => ({ ...c, state: 'dragging', pulse: c.pulse + 1 }))
        await sleep(260)
        await guard()
        api.current.setColumns((prev) => {
          const next = [...prev]
          const a = next.findIndex((c) => c.key === 'status')
          const b = next.findIndex((c) => c.key === 'role')
          if (a !== -1 && b !== -1) {
            const [moved] = next.splice(a, 1)
            next.splice(b, 0, moved!)
          }
          return next
        })
        await sleep(180)
        await moveCursorTo('[data-hero-target="header-status"]', { settle: 380 })
        api.current.setCursor((c) => ({ ...c, state: 'idle' }))
        await sleep(1200 * dwell)

        // 6 — Pin a row
        cap('Pin a row')
        const firstRowId = DATA[0]!.id
        await moveCursorTo(`[data-hero-target="pin-row-${firstRowId}"]`)
        if (cancelled) return
        await click()
        await guard()
        api.current.setPinnedIds(new Set([firstRowId]))
        await sleep(1500 * dwell)

        // 7 — Rich cells
        cap('Rich cells')
        hideCursor()
        await sleep(120)
        await guard()
        api.current.setRich(true)
        await sleep(1800 * dwell)

        // 8 — Instant styling
        cap('Instant styling')
        if (reduced) {
          api.current.setStriped(true)
          api.current.setDensity('compact')
          await sleep(2000 * dwell)
        } else {
          await guard(); api.current.setStriped(true)
          await sleep(560)
          await guard(); api.current.setDensity('compact')
          await sleep(560)
          await guard(); api.current.setStriped(false)
          await sleep(560)
          await guard(); api.current.setDensity('comfortable')
          await sleep(560)
          await guard(); api.current.setStriped(true)
          await sleep(560)
        }

        cap('Reset')
        await sleep(500 * dwell)
      }
    }

    runSequence()

    return () => {
      cancelled = true
      api.current.activeTweenRef.current?.cancel()
      api.current.activeTweenRef.current = null
    }
  }, [reduced, wrapperRef, pausedRef, api])

  return null
}
