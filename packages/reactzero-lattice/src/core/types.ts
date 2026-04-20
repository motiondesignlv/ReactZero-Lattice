// packages/core/src/types.ts

export type ColumnKey<TData> = keyof TData & string

export type RowKey<TData> = {
  [K in keyof TData]: TData[K] extends string | number | symbol ? K : never
}[keyof TData]

export type SortDirection = 'asc' | 'desc' | false

export type SortFn<TData, TValue = unknown> = (
  a: TValue,
  b: TValue,
  rowA: TData,
  rowB: TData,
) => number

export type FilterFn<TData, TValue = unknown> = (
  value: TValue,
  filterValue: string,
  row: TData,
) => boolean

export interface ColumnMeta {}

export type CellContext<TData> = {
  row: TData
  rowIndex: number
  rowKey: string | number
  value: any
  column: ColumnDef<TData>
  isSelected: boolean
  isExpanded: boolean
  isLoading: boolean
  grid: GridInstance<TData>
}

export type ColumnDef<TData, TValue = unknown> = {
  key: ColumnKey<TData>
  header?: string | (() => unknown)
  footer?: string | (() => unknown)
  getValue?: (row: TData) => TValue
  render?: (value: TValue, context: CellContext<TData>) => unknown
  enableSort?: boolean
  sortFn?: SortFn<TData, TValue>
  enableFilter?: boolean
  filterFn?: FilterFn<TData, TValue>
  width?: number | string
  minWidth?: number
  maxWidth?: number
  sticky?: 'left' | 'right'
  meta?: ColumnMeta
}

export type SortState<TData> = {
  key: ColumnKey<TData>
  direction: 'asc' | 'desc'
}

export type GridState<TData> = {
  data: TData[]
  sortState: SortState<TData>[]
  globalFilter: string
  columnFilters: Partial<Record<ColumnKey<TData>, string>>
  currentPage: number
  pageSize: number
  selectedKeys: Set<string | number>
  expandedKeys: Set<string | number>
  isLoading: boolean
}

export type GridAction<TData> =
  | { type: 'SET_DATA'; payload: TData[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SORT'; payload: SortState<TData>[] }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_COLUMN_FILTER'; payload: { key: ColumnKey<TData>; value: string } }
  | { type: 'CLEAR_COLUMN_FILTERS' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'TOGGLE_SELECT'; payload: string | number }
  | { type: 'SELECT_ALL'; payload: (string | number)[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_EXPAND'; payload: string | number }
  | { type: 'RESET'; payload: TData[] }

export type GridInstance<TData> = {
  rawRows: TData[]
  sortedRows: TData[]
  filteredRows: TData[]
  paginatedRows: TData[]
  rows: TData[]
  columns: ColumnDef<TData>[]
  state: GridState<TData>
  dispatch: (action: GridAction<TData>) => void
  getRowKey: (row: TData) => string | number
  isSelected: (row: TData) => boolean
  isExpanded: (row: TData) => boolean
  getGridProps: () => any
  getHeaderProps: () => any
  getRowProps: (row: TData, index: number) => any
  getCellProps: (key: ColumnKey<TData>, row: TData) => any
  getStickyProps: (key: ColumnKey<TData>) => any
  getPlugin: <T>(id: string) => T
  hasPlugin: (id: string) => boolean
  totalRows: number
  totalFilteredRows: number
  totalPages: number
}

export type LatticePlugin<TData, TAPI = any> = {
  id: string
  initialState?: Partial<GridState<TData>>
  init: (options: { grid: GridInstance<TData>; columns: ColumnDef<TData>[]; dispatch: (action: GridAction<TData>) => void }) => TAPI
  reducer?: (state: GridState<TData>, action: any) => GridState<TData>
  processSortedRows?: (rows: TData[], state: GridState<TData>) => TData[]
  processFilteredRows?: (rows: TData[], state: GridState<TData>) => TData[]
  processPaginatedRows?: (rows: TData[], state: GridState<TData>) => TData[]
}
