// packages/react/src/components/Row.tsx

import type { ReactNode, CSSProperties } from 'react'

export type RowProps<TData> = {
  children: ReactNode
  className?: string | ((args: { row: TData; rowIndex: number; isSelected: boolean; isExpanded: boolean }) => string)
  style?: CSSProperties | ((args: { row: TData; rowIndex: number }) => CSSProperties)
  onClick?: (row: TData, index: number) => void
}

export function Row<TData>(_props: RowProps<TData>) {
  // Row is a template descriptor used by Grid.Body
  return null
}

Row.displayName = 'LatticeRow'
