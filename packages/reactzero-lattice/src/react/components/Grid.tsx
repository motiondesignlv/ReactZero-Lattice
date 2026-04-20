// packages/react/src/components/Grid.tsx

import { useReducer, useMemo, useCallback, useEffect, useId, useRef, Children, isValidElement, type ReactNode } from 'react'
import { GridContext, GridKeyboardContext } from '../context'
import { gridReducer } from '../hooks/useGridReducer'
import { runPipeline } from '../../core/engine'
import { initialGridState } from '../../core/utils'
import type {
  ColumnDef,
  ColumnKey,
  LatticePlugin,
  GridInstance,
  GridState,
  GridAction,
} from '../../core/types'

import { Header } from './Header'
import { Body } from './Body'
import { Footer } from './Footer'
import { Row } from './Row'
import { Cell } from './Cell'
import { Detail } from './Detail'
import { HeaderCell } from './HeaderCell'
import { LiveRegionProvider } from './LiveRegion'
import { useLiveAnnouncements } from '../hooks/useLiveAnnouncements'
import { useGridKeyboard } from '../hooks/useGridKeyboard'

export type GridProps<TData> = {
  data: TData[]
  columns?: ColumnDef<TData>[]
  plugins?: LatticePlugin<TData>[]
  rowKey: keyof TData & string
  children: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
  id?: string
  emptyState?: ReactNode
  loadingState?: ReactNode
  className?: string
  /** Enable WAI-ARIA grid keyboard navigation (arrow keys, Home/End, PageUp/PageDown, F2/Escape). Default: true. */
  keyboard?: boolean
  /** Total row count on the server. Set this when using manual-mode plugins so pagination and status messages reflect the server-side total rather than just the current page's `data.length`. */
  rowCount?: number
}

export function Grid<TData>({
  data,
  columns = [],
  plugins = [],
  rowKey,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id: idProp,
  emptyState,
  loadingState,
  className,
  keyboard = true,
  rowCount,
}: GridProps<TData>) {
  const autoId = useId()
  const gridId = idProp ?? `lattice-${autoId}`
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Dev-time warning when no accessible name is provided
  useEffect(() => {
    const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
    if (env !== 'production' && !ariaLabel && !ariaLabelledBy) {
      console.warn('[Lattice] <Grid> requires an accessible name — pass `aria-label` or `aria-labelledby`.')
    }
  }, [ariaLabel, ariaLabelledBy])

  const hasHeader = useMemo(
    () => Children.toArray(children).some(
      child => isValidElement(child) && (child.type as any)?.displayName === 'LatticeHeader'
    ),
    [children]
  )

  // Initialize plugin states
  const initial = useMemo(() => {
    return plugins.reduce((acc, plugin) => ({
      ...acc,
      ...plugin.initialState,
    }), initialGridState<TData>(data))
  }, [data, plugins])

  const [state, dispatch] = useReducer(
    (s: GridState<TData>, a: GridAction<TData>) => gridReducer(s, a, plugins),
    initial
  )

  // Run pipeline
  const { sortedRows, filteredRows, paginatedRows } = useMemo(
    () => runPipeline(data, state, plugins),
    [data, state, plugins]
  )

  const getRowKey = useCallback((row: TData) => {
    const value = row[rowKey]
    if (typeof value === 'string' || typeof value === 'number') return value
    throw new Error(`[Lattice] rowKey "${String(rowKey)}" must resolve to string | number`)
  }, [rowKey])

  // aria-rowindex source of truth: position in the FILTERED set (not paginated)
  // Offset by +2 when a Header rowgroup is present (row 1 = header), else +1
  const headerRowOffset = hasHeader ? 2 : 1
  const filteredRowIndex = useMemo(() => {
    const map = new Map<string | number, number>()
    filteredRows.forEach((row, i) => {
      map.set(getRowKey(row), i + headerRowOffset)
    })
    return map
  }, [filteredRows, getRowKey, headerRowOffset])

  // aria-colindex source of truth: 1-based position in columns
  const columnIndex = useMemo(() => {
    const map = new Map<string, number>()
    columns.forEach((c, i) => map.set(c.key as string, i + 1))
    return map
  }, [columns])

  // Sticky (pinned) column offsets. Cumulative when `width` is numeric.
  const stickyMeta = useMemo(() => {
    const leftOffsets = new Map<string, number>()
    const rightOffsets = new Map<string, number>()
    let leftCursor = 0
    for (const col of columns) {
      if (col.sticky === 'left') {
        leftOffsets.set(col.key as string, leftCursor)
        if (typeof col.width === 'number') leftCursor += col.width
      }
    }
    let rightCursor = 0
    for (let i = columns.length - 1; i >= 0; i--) {
      const col = columns[i]
      if (col && col.sticky === 'right') {
        rightOffsets.set(col.key as string, rightCursor)
        if (typeof col.width === 'number') rightCursor += col.width
      }
    }
    return {
      leftOffsets,
      rightOffsets,
      leftWidth: leftCursor,
      rightWidth: rightCursor,
      hasSticky: leftOffsets.size + rightOffsets.size > 0,
    }
  }, [columns])

  const labelledBy = ariaLabelledBy

  const grid: GridInstance<TData> = useMemo(() => ({
    rawRows: data,
    sortedRows,
    filteredRows,
    paginatedRows,
    rows: paginatedRows,
    columns,
    state,
    dispatch,
    getRowKey,
    isSelected: (row) => state.selectedKeys.has(getRowKey(row)),
    isExpanded: (row) => state.expandedKeys.has(getRowKey(row)),
    totalRows: rowCount ?? data.length,
    totalFilteredRows: rowCount ?? filteredRows.length,
    totalPages: Math.ceil((rowCount ?? filteredRows.length) / state.pageSize),
    getGridProps: () => ({
      role: 'grid',
      id: gridId,
      'aria-label': ariaLabel,
      'aria-labelledby': labelledBy,
      'aria-rowcount': rowCount ?? (filteredRows.length || data.length),
      'aria-colcount': columns.length || undefined,
      'aria-busy': state.isLoading || undefined,
      'data-lattice-grid': true,
      className,
    }),
    getHeaderProps: () => ({ role: 'rowgroup' }),
    getRowProps: (row: TData, _index: number) => {
      const rIndex = filteredRowIndex.get(getRowKey(row)) ?? (_index + headerRowOffset)
      return {
        role: 'row',
        'aria-rowindex': rIndex,
        'data-lattice-row': true,
      }
    },
    getCellProps: (key?: ColumnKey<TData>) => ({
      role: 'gridcell',
      'aria-colindex': key ? columnIndex.get(key as string) : undefined,
      'data-lattice-cell': true,
    }),
    getStickyProps: (key?: ColumnKey<TData>) => {
      if (!key) return {}
      const k = key as unknown as string
      const leftOffset = stickyMeta.leftOffsets.get(k)
      const rightOffset = stickyMeta.rightOffsets.get(k)
      if (leftOffset === undefined && rightOffset === undefined) return {}
      const style: Record<string, string | number> = {
        position: 'sticky',
      }
      if (leftOffset !== undefined) style.left = `${leftOffset}px`
      if (rightOffset !== undefined) style.right = `${rightOffset}px`
      return {
        style,
        'data-lattice-sticky': leftOffset !== undefined ? 'left' : 'right',
      }
    },
    getPlugin: (id: string) => {
      const plugin = plugins.find(p => p.id === id)
      if (!plugin) throw new Error(`Plugin ${id} not found`)
      return plugin.init({ grid: grid as any, columns, dispatch })
    },
    hasPlugin: (id: string) => plugins.some(p => p.id === id),
  }), [data, sortedRows, filteredRows, paginatedRows, state, columns, plugins, rowKey, ariaLabel, labelledBy, gridId, className, getRowKey, filteredRowIndex, columnIndex, headerRowOffset, stickyMeta, rowCount])

  const gridBody = (
    <div {...grid.getGridProps()} ref={rootRef}>
      {state.isLoading && loadingState
        ? loadingState
        : paginatedRows.length === 0 && emptyState
          ? emptyState
          : children}
    </div>
  )

  const regionLabel = ariaLabel ?? (labelledBy ? undefined : undefined)
  const wrapped = stickyMeta.hasSticky ? (
    <div
      role="region"
      tabIndex={0}
      aria-label={regionLabel ? `${regionLabel} (scrollable)` : undefined}
      aria-labelledby={!regionLabel && labelledBy ? labelledBy : undefined}
      data-lattice-scroll-region
      style={{
        overflow: 'auto',
        ['--lattice-pinned-left-w' as any]: `${stickyMeta.leftWidth}px`,
        ['--lattice-pinned-right-w' as any]: `${stickyMeta.rightWidth}px`,
      }}
    >
      {gridBody}
    </div>
  ) : gridBody

  return (
    <GridContext.Provider value={grid as any}>
      <LiveRegionProvider>
        <LiveAnnouncementsBridge grid={grid} state={state} />
        <KeyboardBridge grid={grid} enabled={keyboard} rootRef={rootRef}>
          {wrapped}
        </KeyboardBridge>
      </LiveRegionProvider>
    </GridContext.Provider>
  )
}

function LiveAnnouncementsBridge<TData>({ grid, state }: { grid: GridInstance<TData>; state: GridState<TData> }) {
  useLiveAnnouncements(grid, state)
  return null
}

function KeyboardBridge<TData>({
  grid,
  enabled,
  rootRef,
  children,
}: {
  grid: GridInstance<TData>
  enabled: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const { keyboardContext, onKeyDown } = useGridKeyboard({ gridRef: rootRef, grid, enabled })
  return (
    <GridKeyboardContext.Provider value={keyboardContext}>
      <div
        onKeyDown={onKeyDown}
        data-lattice-keyboard={enabled ? 'on' : 'off'}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </GridKeyboardContext.Provider>
  )
}

Grid.Header = Header
Grid.Body = Body
Grid.Footer = Footer
Grid.Row = Row
Grid.Cell = Cell
Grid.Detail = Detail
Grid.HeaderCell = HeaderCell
