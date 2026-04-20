// packages/react/src/hooks/useGridKeyboard.ts
//
// Implements the WAI-ARIA data-grid keyboard pattern:
//   https://www.w3.org/WAI/ARIA/apg/patterns/grid/
//
// - Single tab stop (roving tabindex) across all grid cells and column headers.
// - Arrow Up/Down/Left/Right move focus one cell.
// - Home / End: first / last cell in current row.
// - Ctrl+Home / Ctrl+End: top-left / bottom-right.
// - PageUp / PageDown: move by `pageSize`.
// - Enter / F2: enter "interaction mode" (tab cycles within cell).
// - Escape: exit interaction mode.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { GridInstance } from '../../core/types'
import type { ActiveCell } from '../context'

export type UseGridKeyboardArgs<TData> = {
  gridRef: RefObject<HTMLElement | null>
  grid: GridInstance<TData>
  enabled: boolean
}

export function useGridKeyboard<TData>({ gridRef, grid, enabled }: UseGridKeyboardArgs<TData>) {
  const [activeCell, setActiveCellState] = useState<ActiveCell>(null)
  const [isInteracting, setInteracting] = useState(false)

  // Seed active cell: first row, first column, once data/columns are available
  useEffect(() => {
    if (!enabled || activeCell) return
    const firstRow = grid.rows[0]
    const firstCol = grid.columns[0]
    if (firstRow && firstCol) {
      setActiveCellState({
        rowKey: grid.getRowKey(firstRow),
        columnKey: firstCol.key as string,
      })
    }
  }, [enabled, activeCell, grid])

  // Clamp active cell when underlying rows/columns change (e.g. filter removed it)
  useEffect(() => {
    if (!activeCell || !enabled) return
    const rowExists = grid.rows.some(r => grid.getRowKey(r) === activeCell.rowKey)
    const colExists = grid.columns.some(c => c.key === activeCell.columnKey)
    if (!rowExists || !colExists) {
      const firstRow = grid.rows[0]
      const firstCol = grid.columns[0]
      if (firstRow && firstCol) {
        setActiveCellState({
          rowKey: grid.getRowKey(firstRow),
          columnKey: firstCol.key as string,
        })
      } else {
        setActiveCellState(null)
      }
    }
  }, [grid.rows, grid.columns, activeCell, enabled, grid])

  const setActiveCell = useCallback((cell: ActiveCell) => {
    setActiveCellState(cell)
  }, [])

  const moveBy = useCallback(
    (dRow: number, dCol: number) => {
      if (!activeCell) return
      const colKeys = grid.columns.map(c => c.key as string)
      const rowKeys = grid.rows.map(r => grid.getRowKey(r))
      const curRow = rowKeys.indexOf(activeCell.rowKey)
      const curCol = colKeys.indexOf(activeCell.columnKey)
      if (curRow < 0 || curCol < 0) return
      const nextRow = Math.max(0, Math.min(rowKeys.length - 1, curRow + dRow))
      const nextCol = Math.max(0, Math.min(colKeys.length - 1, curCol + dCol))
      const newRow = rowKeys[nextRow]
      const newCol = colKeys[nextCol]
      if (newRow !== undefined && newCol !== undefined) {
        setActiveCellState({ rowKey: newRow, columnKey: newCol })
      }
    },
    [activeCell, grid]
  )

  const moveTo = useCallback(
    (rowIdx: number, colIdx: number) => {
      const colKeys = grid.columns.map(c => c.key as string)
      const rowKeys = grid.rows.map(r => grid.getRowKey(r))
      const r = Math.max(0, Math.min(rowKeys.length - 1, rowIdx))
      const c = Math.max(0, Math.min(colKeys.length - 1, colIdx))
      const newRow = rowKeys[r]
      const newCol = colKeys[c]
      if (newRow !== undefined && newCol !== undefined) {
        setActiveCellState({ rowKey: newRow, columnKey: newCol })
      }
    },
    [grid]
  )

  // Focus the DOM cell whenever activeCell changes (and keyboard nav is live)
  const shouldFocusRef = useRef(false)
  useEffect(() => {
    if (!enabled || !activeCell || !shouldFocusRef.current) return
    const root = gridRef.current
    if (!root) return
    const sel = `[data-lattice-cell][data-lattice-row-key="${String(activeCell.rowKey)}"][data-lattice-col-key="${String(activeCell.columnKey)}"]`
    const el = root.querySelector<HTMLElement>(sel)
    if (el) {
      el.focus({ preventScroll: false })
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    shouldFocusRef.current = false
  }, [activeCell, enabled, gridRef])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!enabled || !activeCell) return
      if (isInteracting) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setInteracting(false)
          shouldFocusRef.current = true
          // Re-focus the cell itself
          setActiveCellState({ ...activeCell })
        }
        return
      }

      const pageSize = Math.max(1, grid.state.pageSize)

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(-1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(1, 0)
          break
        case 'ArrowLeft':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(0, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(0, 1)
          break
        case 'Home':
          e.preventDefault()
          shouldFocusRef.current = true
          if (e.ctrlKey || e.metaKey) moveTo(0, 0)
          else moveBy(0, -grid.columns.length)
          break
        case 'End':
          e.preventDefault()
          shouldFocusRef.current = true
          if (e.ctrlKey || e.metaKey) moveTo(grid.rows.length - 1, grid.columns.length - 1)
          else moveBy(0, grid.columns.length)
          break
        case 'PageUp':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(-pageSize, 0)
          break
        case 'PageDown':
          e.preventDefault()
          shouldFocusRef.current = true
          moveBy(pageSize, 0)
          break
        case 'Enter':
        case 'F2':
          if (cellHasInteractiveChildren(e.currentTarget)) {
            e.preventDefault()
            setInteracting(true)
          }
          break
        default:
          break
      }
    },
    [enabled, activeCell, isInteracting, moveBy, moveTo, grid]
  )

  const value = useMemo(
    () => ({
      enabled,
      activeCell,
      setActiveCell,
      isInteracting,
      setInteracting,
    }),
    [enabled, activeCell, setActiveCell, isInteracting]
  )

  return { keyboardContext: value, onKeyDown }
}

function cellHasInteractiveChildren(root: HTMLElement): boolean {
  const sel = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  // Include root itself; but we really care about descendants inside the focused cell.
  const cell = root.closest<HTMLElement>('[data-lattice-cell]')
  if (!cell) return false
  return cell.querySelector(sel) !== null
}
