// packages/react/src/components/Body.tsx

import { Children, isValidElement, type ReactNode } from 'react'
import { useGridContext, RowContext } from '../context'
import type { RowProps } from './Row'

function separateChildren(children: ReactNode) {
  const childArray = Children.toArray(children)
  const details: ReactNode[] = []
  const rest: ReactNode[] = []

  childArray.forEach(child => {
    if (isValidElement(child) && (child.type as any).displayName === 'LatticeDetail') {
      details.push(child)
    } else {
      rest.push(child)
    }
  })

  return { rest, details }
}

export function Body<TData>({ children }: { children: ReactNode }) {
  const grid = useGridContext<TData>()

  const rowTemplate = Children.toArray(children).find(
    child => isValidElement(child) && (child.type as any).displayName === 'LatticeRow'
  )

  if (!rowTemplate || !isValidElement(rowTemplate)) {
    throw new Error('[Lattice] <Grid.Body> must contain exactly one <Row> child')
  }

  const rowProps = rowTemplate.props as RowProps<TData>
  const { rest: rowContent, details } = separateChildren(rowProps.children)
  const hasDetail = details.length > 0

  return (
    <div role="rowgroup" data-lattice-body>
      {grid.rows.map((row, index) => {
        const isSelected = grid.isSelected(row)
        const isExpanded = grid.isExpanded(row)

        const className = typeof rowProps.className === 'function'
          ? rowProps.className({ row, rowIndex: index, isSelected, isExpanded })
          : rowProps.className

        const style = typeof rowProps.style === 'function'
          ? rowProps.style({ row, rowIndex: index })
          : rowProps.style

        return (
          <div
            key={grid.getRowKey(row)}
            {...grid.getRowProps(row, index)}
            className={className}
            style={style}
            aria-selected={isSelected || undefined}
            aria-expanded={hasDetail ? isExpanded : undefined}
            data-selected={isSelected || undefined}
            data-expanded={isExpanded || undefined}
            onClick={() => rowProps.onClick?.(row, index)}
          >
            <RowContext.Provider value={{ row, rowIndex: index, isSelected, isExpanded }}>
              {rowContent}
              {details}
            </RowContext.Provider>
          </div>
        )
      })}
    </div>
  )
}
