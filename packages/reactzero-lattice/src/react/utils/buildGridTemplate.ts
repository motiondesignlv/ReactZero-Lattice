// packages/react/src/utils/buildGridTemplate.ts

import type { ColumnDef } from '../../core/types'

/**
 * Generates a CSS `grid-template-columns` value from an array of column definitions.
 * Respects width, minWidth, and maxWidth from each ColumnDef.
 */
export function buildGridTemplate(columns: ColumnDef<any>[]): string {
  return columns.map(col => {
    if (col.width) {
      const w = typeof col.width === 'number' ? `${col.width}px` : col.width
      return w
    }
    if (col.minWidth && col.maxWidth) {
      return `minmax(${col.minWidth}px, ${col.maxWidth}px)`
    }
    if (col.minWidth) {
      return `minmax(${col.minWidth}px, 1fr)`
    }
    if (col.maxWidth) {
      return `minmax(0, ${col.maxWidth}px)`
    }
    return '1fr'
  }).join(' ')
}
