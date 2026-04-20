// packages/react/src/components/HeaderCell.tsx

import { type CSSProperties, type ReactNode } from 'react'
import { useGridContext } from '../context'
import type { ColumnKey } from '../../core/types'

export type HeaderCellProps<TData> = {
  columnKey: ColumnKey<TData>
  label?: ReactNode
  sortable?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

function SortIndicator({ ariaSort }: { ariaSort: 'ascending' | 'descending' | 'none' }) {
  if (ariaSort === 'ascending') return <span aria-hidden="true" data-lattice-sort-indicator="asc"> ↑</span>
  if (ariaSort === 'descending') return <span aria-hidden="true" data-lattice-sort-indicator="desc"> ↓</span>
  return <span aria-hidden="true" data-lattice-sort-indicator="none"> ↕</span>
}

export function HeaderCell<TData>({
  columnKey,
  label,
  sortable,
  className,
  style,
  children,
}: HeaderCellProps<TData>) {
  const grid = useGridContext<TData>()
  const columnDef = grid.columns.find(c => c.key === columnKey)
  const autoSortable = sortable ?? columnDef?.enableSort ?? false

  const colIndexMap = grid.columns
  const colIndex = colIndexMap.findIndex(c => c.key === columnKey)

  const resolvedLabel = children ?? label ?? (typeof columnDef?.header === 'string' ? columnDef.header : String(columnKey))

  const stickyProps = grid.getStickyProps(columnKey)

  if (!autoSortable || !grid.hasPlugin('sort')) {
    return (
      <div
        role="columnheader"
        {...stickyProps}
        aria-colindex={colIndex >= 0 ? colIndex + 1 : undefined}
        className={className}
        style={{ ...style, ...(stickyProps.style ?? {}) }}
        data-lattice-header-cell
      >
        {resolvedLabel}
      </div>
    )
  }

  const sort = grid.getPlugin<{
    getSortHeaderProps: (key: ColumnKey<TData>) => {
      role: 'columnheader'
      'aria-sort': 'ascending' | 'descending' | 'none'
      tabIndex: number
      onClick: () => void
      onKeyDown: (e: { key: string; preventDefault: () => void }) => void
      'data-lattice-sort-toggle': true
    }
  }>('sort')

  const sortProps = sort.getSortHeaderProps(columnKey)

  return (
    <div
      {...sortProps}
      {...stickyProps}
      aria-colindex={colIndex >= 0 ? colIndex + 1 : undefined}
      className={className}
      style={{ ...style, ...(stickyProps.style ?? {}) }}
      data-lattice-header-cell
    >
      {resolvedLabel}
      <SortIndicator ariaSort={sortProps['aria-sort']} />
    </div>
  )
}

HeaderCell.displayName = 'LatticeHeaderCell'
