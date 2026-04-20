// packages/react/src/context.tsx

import { createContext, useContext } from 'react'
import type { GridInstance } from '../core/types'

export const GridContext = createContext<GridInstance<any> | null>(null)

export function useGridContext<TData>(): GridInstance<TData> {
  const ctx = useContext(GridContext)
  if (!ctx) {
    throw new Error('[Lattice] useGridContext must be used inside a <Grid> component')
  }
  return ctx as GridInstance<TData>
}

export type RowContextValue<TData = any> = {
  row: TData
  rowIndex: number
  isSelected: boolean
  isExpanded: boolean
}

export const RowContext = createContext<RowContextValue | null>(null)

export function useRowContext<TData>(): RowContextValue<TData> {
  const ctx = useContext(RowContext)
  if (!ctx) {
    throw new Error('[Lattice] useRowContext must be used inside a <Grid.Body> row')
  }
  return ctx as RowContextValue<TData>
}

export type ActiveCell = { rowKey: string | number; columnKey: string } | null

export type GridKeyboardContextValue = {
  enabled: boolean
  activeCell: ActiveCell
  setActiveCell: (cell: ActiveCell) => void
  isInteracting: boolean
  setInteracting: (value: boolean) => void
}

export const GridKeyboardContext = createContext<GridKeyboardContextValue | null>(null)

export function useGridKeyboardContext(): GridKeyboardContextValue {
  const ctx = useContext(GridKeyboardContext)
  if (!ctx) {
    return {
      enabled: false,
      activeCell: null,
      setActiveCell: () => {},
      isInteracting: false,
      setInteracting: () => {},
    }
  }
  return ctx
}

export type LiveRegionPriority = 'polite' | 'assertive'

export type LiveRegionContextValue = {
  announce: (message: string, priority?: LiveRegionPriority) => void
}

export const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

export function useLiveRegion(): LiveRegionContextValue {
  const ctx = useContext(LiveRegionContext)
  if (!ctx) {
    return { announce: () => {} }
  }
  return ctx
}
