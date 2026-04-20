// packages/react/src/components/Detail.tsx

import { type ReactNode } from 'react'
import { useGridContext, useRowContext } from '../context'
import type { CellContext } from '../../core/types'

export type DetailProps<TData> = {
  children: (row: TData, context: Omit<CellContext<TData>, 'value' | 'column'>) => ReactNode
  className?: string
}

export function Detail<TData>({ children, className }: DetailProps<TData>) {
  const grid = useGridContext<TData>()
  const { row, rowIndex, isSelected, isExpanded } = useRowContext<TData>()

  const context = {
    row,
    rowIndex,
    rowKey: grid.getRowKey(row),
    isSelected,
    isExpanded,
    isLoading: grid.state.isLoading,
    grid,
  }

  return (
    <div
      data-lattice-detail
      className={className}
      role="region"
      aria-hidden={!isExpanded || undefined}
      hidden={!isExpanded || undefined}
    >
      {isExpanded ? children(row, context as any) : null}
    </div>
  )
}

Detail.displayName = 'LatticeDetail'
