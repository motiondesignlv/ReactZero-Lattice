// packages/react/src/components/Cell.tsx

import { useCallback, type CSSProperties, type ReactNode } from 'react'
import { useGridContext, useGridKeyboardContext, useRowContext } from '../context'
import type { ColumnKey, CellContext } from '../../core/types'

export type CellProps<TData> = {
  columnKey?: ColumnKey<TData>
  render?: (value: any, context: CellContext<TData>) => ReactNode
  className?: string
  style?: CSSProperties
  colSpan?: number
  overflow?: 'ellipsis' | 'wrap' | 'clip'
  title?: string | boolean
}

export function Cell<TData>({
  columnKey,
  render,
  className,
  style,
  colSpan,
  overflow,
  title,
}: CellProps<TData>) {
  const grid = useGridContext<TData>()
  const { row, rowIndex, isSelected, isExpanded } = useRowContext<TData>()
  const keyboard = useGridKeyboardContext()

  const columnDef = columnKey ? grid.columns.find(c => c.key === columnKey) : undefined

  const rowKey = grid.getRowKey(row)

  const value = row && columnKey
    ? (columnDef?.getValue ? columnDef.getValue(row) : (row as any)[columnKey])
    : undefined

  const context: CellContext<TData> = {
    row,
    rowIndex,
    rowKey,
    value,
    column: columnDef as any,
    isSelected,
    isExpanded,
    isLoading: grid.state.isLoading,
    grid,
  }

  let content: ReactNode = null
  if (render) {
    content = render(value, context)
  } else if (columnDef?.render) {
    content = columnDef.render(value, context) as ReactNode
  } else if (value != null) {
    content = String(value)
  }

  const titleValue = title === true
    ? (value != null && typeof value !== 'object' ? String(value) : undefined)
    : (typeof title === 'string' ? title : undefined)

  const isActive = keyboard.enabled
    && !!keyboard.activeCell
    && keyboard.activeCell.rowKey === rowKey
    && keyboard.activeCell.columnKey === (columnKey as unknown as string)

  const tabIndex = keyboard.enabled
    ? (isActive ? 0 : -1)
    : undefined

  const onFocus = useCallback(() => {
    if (!keyboard.enabled || !columnKey) return
    keyboard.setActiveCell({ rowKey, columnKey: columnKey as unknown as string })
  }, [keyboard, rowKey, columnKey])

  const stickyProps = columnKey ? grid.getStickyProps(columnKey as any) : {}

  return (
    <div
      {...grid.getCellProps(columnKey as any, row as any)}
      {...stickyProps}
      className={className}
      style={{
        ...style,
        ...(stickyProps.style ?? {}),
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
      }}
      data-overflow={overflow || undefined}
      data-lattice-row-key={String(rowKey)}
      data-lattice-col-key={columnKey ? String(columnKey) : undefined}
      data-active={isActive || undefined}
      tabIndex={tabIndex}
      onFocus={onFocus}
      title={titleValue}
    >
      {content}
    </div>
  )
}
