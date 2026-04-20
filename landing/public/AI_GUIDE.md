# Lattice — AI Implementation Guide

> **Audience:** LLM coding assistants (Claude, ChatGPT, Copilot, Cursor, etc.).
> **Goal:** Give the assistant everything it needs to correctly scaffold, extend, and debug any table built on `@reactzero/lattice/react` — **without guessing APIs or inventing props**.
> **Version:** Lattice `0.1.0` · React 18+ / 19.
> **Zero third-party runtime dependencies.** `@reactzero/lattice/core` has none. `@reactzero/lattice/react` peers on React and nothing else — no lodash, no date-fns, no utility libraries.
> **Covers:** cell-first composition, plugin pipeline, WAI-ARIA grid keyboard navigation, live-region announcements, sticky/pinned columns, server-side (manual) mode, and headless rendering.

This document is self-contained. Read it top-to-bottom before emitting code. When in doubt, follow the **RULES** block at the end.

---

## 1. Mental Model (read this first)

Lattice is a **cell-first, headless, plugin-driven** data grid for React. It is **not** a MUI/AG-Grid-style config grid with a giant `<DataGrid columns={...} rows={...}/>` prop dump.

You build the table by **composing primitives** — the same way you build a form in React. The grid has three layers:

```
┌──────────────────────────────────────┐
│  <Grid>  ← owns data, state, plugins │
│    <Grid.Header>                     │
│      <div className="grid-row ...">  │ ← YOU own layout / styling
│        <div className="cell">...</…> │
│      </div>                          │
│    </Grid.Header>                    │
│    <Grid.Body>                       │
│      <Row>                           │ ← template; rendered once per row
│        <div className="grid-row…">   │
│          <Cell columnKey="name" />   │ ← reads from row via context
│        </div>                        │
│      </Row>                          │
│    </Grid.Body>                      │
│    <Grid.Footer>...</Grid.Footer>    │
│  </Grid>                             │
└──────────────────────────────────────┘
```

Three rules you must never break:

1. **`Cell` reads from `RowContext`.** Never pass `row` or `index` to `<Cell>` as a prop — it consumes React context.
2. **Never `cloneElement` the row template.** `Grid.Body` already handles rendering the `<Row>` template once per row. Your job is to return JSX; Lattice's job is to iterate.
3. **Plugins own a slice of state.** Sorting, filtering, pagination are **plugins** — you install them in `plugins={...}` and access them with `usePlugin('sort' | 'filter' | 'paginate')`.

---

## 2. Package and subpaths

Everything ships in a single tree-shakable npm package called **`@reactzero/lattice`**. Consumers pick what they need via subpath imports — unused code is dropped at bundle time (ESM + `sideEffects: false`).

| Subpath                         | Purpose                                                           |
|---------------------------------|-------------------------------------------------------------------|
| `@reactzero/lattice/core`        | Framework-agnostic engine: types, reducer, pipeline. Zero deps.   |
| `@reactzero/lattice/react`       | React bindings: `<Grid>`, `<Row>`, `<Cell>`, hooks, context.      |
| `@reactzero/lattice/sort`        | Sort plugin (`sortPlugin`, `SortPluginAPI`)                       |
| `@reactzero/lattice/filter`      | Filter plugin — global + per-column, debounced                    |
| `@reactzero/lattice/paginate`    | Pagination plugin                                                 |
| `@reactzero/lattice/styles/a11y.css` | Opt-in accessibility baseline stylesheet                      |

Peer deps: `react >= 18`, `react-dom >= 18`.

**Install:**

```bash
npm install @reactzero/lattice
```

**Import paths you MUST use** (these are the real entrypoints — do not guess):

```ts
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin, useGridContext, useRowContext } from '@reactzero/lattice/react/hooks'
import { buildGridTemplate } from '@reactzero/lattice/react/utils'

import type { ColumnDef, GridInstance, CellContext } from '@reactzero/lattice/core/types'

import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { filterPlugin, type FilterPluginAPI } from '@reactzero/lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'
```

> **Do not** import from `@reactzero/lattice/react` root (`import { Grid } from '@reactzero/lattice/react'`) unless you need a re-export — always prefer the subpath entrypoints above. This keeps bundles lean and matches the official examples.

---

## 3. Minimal Table (60-second hello world)

```tsx
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'

type Employee = { id: number; name: string; role: string; salary: number }

const employees: Employee[] = [
  { id: 1, name: 'Alice', role: 'Engineer', salary: 135000 },
  { id: 2, name: 'Bob',   role: 'Designer', salary: 120000 },
]

export function EmployeeTable() {
  return (
    <Grid data={employees} rowKey="id">
      <Grid.Header>
        <div className="grid-row grid-cols-3 header-row">
          <div className="cell">Name</div>
          <div className="cell">Role</div>
          <div className="cell">Salary</div>
        </div>
      </Grid.Header>
      <Grid.Body>
        <Row>
          <div className="grid-row grid-cols-3">
            <Cell columnKey="name" />
            <Cell columnKey="role" />
            <Cell columnKey="salary" render={(v) => `$${Number(v).toLocaleString()}`} />
          </div>
        </Row>
      </Grid.Body>
    </Grid>
  )
}
```

**Required props on `<Grid>`:**

- `data: TData[]` — the array of rows.
- `rowKey: keyof TData & string` — the field whose value uniquely identifies a row (must resolve to `string | number`). Lattice will throw if `rowKey` does not resolve correctly.

**Required structure:**

- `<Grid.Body>` **must contain exactly one `<Row>`**. `<Row>` is a *template*: it renders once and Lattice maps over the visible rows, cloning the template into each one via `RowContext.Provider`. If you put two `<Row>` elements inside `<Grid.Body>`, Lattice will throw.

---

## 4. API Reference

### 4.1 `<Grid>` props

```ts
type GridProps<TData> = {
  data: TData[]                          // required
  rowKey: keyof TData & string           // required, e.g. "id"
  columns?: ColumnDef<TData>[]           // optional per-column metadata
  plugins?: LatticePlugin<TData>[]       // optional sort/filter/paginate/custom
  children: ReactNode                    // Header/Body/Footer composition
  'aria-label'?: string                  // REQUIRED unless aria-labelledby is set (dev-time warn)
  'aria-labelledby'?: string             // id of an element that labels the grid
  id?: string                            // optional; otherwise auto-generated (useId)
  keyboard?: boolean                     // WAI-ARIA grid keyboard nav, default: true
  rowCount?: number                      // server-side total; set for manual-mode plugins
  emptyState?: ReactNode                 // shown when rows.length === 0
  loadingState?: ReactNode               // shown when state.isLoading === true
  className?: string
}
```

**Accessible name.** Pass `aria-label` or `aria-labelledby` or you'll get a dev-time warning. The grid renders `role="grid"` with `aria-rowcount`/`aria-colcount`.

**`keyboard` (default `true`).** Wires arrow keys, Home/End, PageUp/PageDown, F2/Escape for cell focus and interaction mode. Turn off (`keyboard={false}`) only when your custom rendering handles keyboard itself (e.g. virtualized tables with their own navigation).

**`rowCount`.** When using manual/server-side plugins (§6.5), the grid can't infer the *real* total from `data` (which is just the current page). Set `rowCount` so `totalPages`, `aria-rowcount`, and status messages reflect the server total.

**Sticky columns.** If any `ColumnDef` has `sticky: 'left' | 'right'`, `<Grid>` auto-wraps its output in a scrollable `role="region"` div and exposes `getStickyProps(columnKey)` on the grid instance for your cells.

### 4.2 `<Grid.Header>`, `<Grid.Body>`, `<Grid.Footer>`

Plain wrappers with correct ARIA (`role="rowgroup"`). Their children are yours — use any layout you want (CSS grid, flex, table, whatever). Lattice does not enforce a column template.

- **`<Grid.Header>`** — wraps your header rows. Presence of a Header shifts `aria-rowindex` so data rows start at row 2.
- **`<Grid.Body>`** — must contain **exactly one** `<Row>` template (§4.3). Lattice iterates `grid.rows` and renders the template once per row inside a `RowContext.Provider`.
- **`<Grid.Footer>`** — arbitrary JSX; useful for totals/pagination/status bars.

### 4.3 `<Row>`

A **template descriptor**. It renders `null` on its own (`displayName: 'LatticeRow'`). `Grid.Body` detects it by `displayName` and iterates.

```ts
type RowProps<TData> = {
  children: ReactNode
  className?: string | ((args: { row: TData; rowIndex: number; isSelected: boolean; isExpanded: boolean }) => string)
  style?: CSSProperties | ((args: { row: TData; rowIndex: number }) => CSSProperties)
  onClick?: (row: TData, index: number) => void
}
```

- `className` can be a **function** that receives row context — use this for conditional striping/highlighting.
- `style` same deal.
- `onClick` fires on the row container.

### 4.4 `<Cell>`

```ts
type CellProps<TData> = {
  columnKey?: ColumnKey<TData>                                       // which field to read
  render?: (value: any, context: CellContext<TData>) => ReactNode    // cell-level render
  className?: string
  style?: CSSProperties
  colSpan?: number                                                   // for CSS grid: `grid-column: span N`
  overflow?: 'ellipsis' | 'wrap' | 'clip'                            // sets [data-overflow]
  title?: string | boolean                                           // true → use cell value as tooltip
}
```

**Resolution order for cell content:**

1. `<Cell render={fn} />` prop (cell-level).
2. `columnDef.render` if a matching `ColumnDef` exists.
3. `columnDef.getValue(row)` or `row[columnKey]` stringified.

`CellContext` passed to `render`:

```ts
type CellContext<TData> = {
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
```

### 4.5 `<Grid.Detail>`

Expandable-row renderer. Must be used inside `<Grid.Body>`'s `<Row>`. Renders its children only when the row's key is in `state.expandedKeys`.

```tsx
<Row>
  <div className="grid-row grid-cols-4">
    <Cell columnKey="name" />
    ...
  </div>
  <Grid.Detail>
    {(row) => <div className="detail-panel">Extra info for {row.name}</div>}
  </Grid.Detail>
</Row>
```

To toggle expansion, dispatch:

```ts
const grid = useGridContext<Employee>()
grid.dispatch({ type: 'TOGGLE_EXPAND', payload: grid.getRowKey(row) })
```

### 4.6 `<Grid.HeaderCell>`

Drop-in header cell that auto-wires sort state from the `sort` plugin, emits correct ARIA (`role="columnheader"`, `aria-sort`, `aria-colindex`), and applies sticky offsets if the column is pinned. Prefer this over hand-rolling sortable headers.

```ts
type HeaderCellProps<TData> = {
  columnKey: ColumnKey<TData>
  label?: ReactNode               // falls back to columnDef.header or columnKey
  sortable?: boolean              // override; otherwise reads columnDef.enableSort
  className?: string
  style?: CSSProperties
  children?: ReactNode            // overrides label
}
```

```tsx
<Grid.Header>
  <div className="grid-row grid-cols-3 header-row">
    <Grid.HeaderCell columnKey="name" label="Name" sortable />
    <Grid.HeaderCell columnKey="role" label="Role" />
    <Grid.HeaderCell columnKey="salary" label="Salary" sortable />
  </div>
</Grid.Header>
```

If the `sort` plugin is not installed, `<Grid.HeaderCell>` renders a plain `role="columnheader"` — `sortable` is silently ignored.

---

## 5. `ColumnDef` (optional, but powerful)

You can skip `columns` entirely — `<Cell columnKey="name" />` will just read `row.name`. But defining columns centralizes:

```ts
type ColumnDef<TData, TValue = unknown> = {
  key: ColumnKey<TData>                              // required
  header?: string | (() => unknown)
  footer?: string | (() => unknown)
  getValue?: (row: TData) => TValue                  // derive value (e.g. full name)
  render?: (value: TValue, ctx: CellContext<TData>) => unknown
  enableSort?: boolean
  sortFn?: SortFn<TData, TValue>                     // (a, b, rowA, rowB) => number
  enableFilter?: boolean
  filterFn?: FilterFn<TData, TValue>
  width?: number | string
  minWidth?: number
  maxWidth?: number
  sticky?: 'left' | 'right'
  meta?: ColumnMeta                                  // user-extensible
}
```

Use `buildGridTemplate(columns)` to turn a `ColumnDef[]` into a `grid-template-columns` value:

```ts
import { buildGridTemplate } from '@reactzero/lattice/react/utils'

const columns: ColumnDef<Employee>[] = [
  { key: 'name', width: 240 },
  { key: 'role', minWidth: 160 },
  { key: 'salary', width: '1fr' },
]

const template = buildGridTemplate(columns)
// → "240px minmax(160px, 1fr) 1fr"

<div className="grid-row" style={{ gridTemplateColumns: template }}>...</div>
```

---

## 6. Plugins

A plugin is an object with `id`, optional `initialState`, an `init()` that returns its public API, and optional pipeline hooks (`processSortedRows`, `processFilteredRows`, `processPaginatedRows`).

You **install** plugins once with `useMemo` (MANDATORY — see RULES §14):

```tsx
const plugins = useMemo(
  () => [sortPlugin<Employee>({ multiSort: false })],
  []
)
```

You **consume** plugin APIs inside grid children via `usePlugin('<id>')`:

```tsx
function SortHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div onClick={() => sort.toggleSort(columnKey)}>
      {label} <span>{dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}</span>
    </div>
  )
}
```

### 6.1 `sortPlugin` — `@reactzero/lattice/sort`

**Factory:**
```ts
sortPlugin<TData>(options?: {
  multiSort?: boolean                                      // default: false
  manual?: boolean                                         // default: false — see §6.5
  onSortChange?: (sortState: SortState<TData>[]) => void   // fires in manual mode
}): LatticePlugin<TData>
```

**API (`SortPluginAPI<TData>`):**

```ts
// State mutation
setSortBy(key, direction: 'asc' | 'desc' | false): void
toggleSort(key): void                  // cycles: none → asc → desc → none
clearSort(): void

// State reading
getSortState(): SortState<TData>[]
isSorted(key): 'asc' | 'desc' | false

// Accessibility prop-getters (recommended for custom headers)
getSortHeaderProps(key): SortHeaderProps     // role, aria-sort, tabIndex, onClick, onKeyDown
getSortStatusMessage(): string               // "Sorted by name ascending" / "No sort applied"
```

Default comparator handles `number`, `Date`, and strings (with `localeCompare({ numeric: true })`). Nulls always sort last. Override per column with `ColumnDef.sortFn`.

**Prefer `<Grid.HeaderCell>`** (§4.6) over hand-rolling sortable headers — it calls `getSortHeaderProps` for you. Reach for `getSortHeaderProps` directly only when you need a fully custom header layout.

### 6.2 `filterPlugin` — `@reactzero/lattice/filter`

**Factory:**
```ts
filterPlugin<TData>(options?: {
  debounce?: number                                        // default: 200 (ms)
  manual?: boolean                                         // default: false — see §6.5
  onFilterChange?: (filters: FilterSnapshot<TData>) => void  // fires in manual mode
}): LatticePlugin<TData>
```

**API (`FilterPluginAPI<TData>`):**

```ts
// State mutation (debounced)
setGlobalFilter(value: string): void          // searches across all stringified fields
setColumnFilter(key, value: string): void
clearFilters(): void

// State reading (returns pending/pre-debounce values so inputs stay controlled)
getGlobalFilter(): string
getColumnFilter(key): string

// Accessibility prop-getters
getGlobalFilterInputProps(label?): FilterInputProps
getFilterInputProps(key, label): FilterInputProps          // per-column <input> props
getClearFilterProps(label?): FilterClearProps              // <button> props with onClick
getFilterStatusMessage(): string                           // "Showing 14 of 200 results"
```

The default match is **case-insensitive `includes`** across stringified values. Override per column with `ColumnDef.filterFn`. All setters debounce; the input `value` returned by the getters mirrors the pending (pre-debounce) value so your input stays responsive to typing.

### 6.3 `paginatePlugin` — `@reactzero/lattice/paginate`

**Factory:**
```ts
paginatePlugin<TData>(options?: {
  pageSize?: number                                              // default: 20
  manual?: boolean                                               // default: false — see §6.5
  onPaginationChange?: (p: { currentPage; pageSize }) => void    // fires in manual mode
}): LatticePlugin<TData>
```

**API (`PaginatePluginAPI`):**

```ts
// State mutation
goToPage(page: number): void                                    // 0-indexed, clamped
goToNextPage(): void
goToPrevPage(): void
setPageSize(size: number): void                                 // resets to page 0

// State reading (getters)
readonly currentPage: number                                    // 0-indexed
readonly pageSize: number
readonly totalPages: number
readonly hasNextPage: boolean
readonly hasPrevPage: boolean

// Accessibility prop-getters
getPaginationProps(label?): { role: 'navigation'; 'aria-label' }
getPageButtonProps(page, label?): PageButtonProps              // includes aria-current: 'page' when active
getPrevButtonProps(label?): PageButtonProps
getNextButtonProps(label?): PageButtonProps
getPageSizeSelectProps(label?): PageSizeSelectProps            // value + onChange wired
getPageStatusMessage(): string                                 // "Page 2 of 9"
```

> **Pages are 0-indexed internally.** Display with `currentPage + 1`.

### 6.4 Pipeline ordering

`runPipeline` runs stages **in this order**, once per render:

1. **Sort** — `processSortedRows(data, state)` for each plugin.
2. **Filter** — `processFilteredRows(sortedRows, state)`.
3. **Paginate** — `processPaginatedRows(filteredRows, state)`.

`grid.rows` is the paginated slice. `grid.sortedRows` / `grid.filteredRows` / `grid.rawRows` are all available on the instance.

### 6.5 Manual mode (server-side)

All three built-in plugins accept `manual: true`, which:

- **Skips the pipeline stage** — the plugin passes rows through untouched, so the server-returned page is what the user sees.
- **Emits a callback** (`onSortChange` / `onFilterChange` / `onPaginationChange`) whenever the user interacts. Re-fetch and replace `data` inside the callback.
- **Still exposes all state + prop-getters** so your UI stays controlled.

Pair with `<Grid rowCount={serverTotal}>` so `totalPages` and `aria-rowcount` reflect the server-side total rather than `data.length` (just the current page).

```tsx
function ServerTable() {
  const [data, setData] = useState<Row[]>([])
  const [total, setTotal] = useState(0)

  const plugins = useMemo(() => [
    sortPlugin<Row>({
      manual: true,
      onSortChange: (s) => fetchPage({ sort: s }).then((r) => { setData(r.rows); setTotal(r.total) }),
    }),
    paginatePlugin<Row>({
      pageSize: 25,
      manual: true,
      onPaginationChange: ({ currentPage, pageSize }) =>
        fetchPage({ page: currentPage, size: pageSize }).then((r) => { setData(r.rows); setTotal(r.total) }),
    }),
  ], [])

  return <Grid data={data} rowKey="id" rowCount={total} aria-label="Orders" plugins={plugins}>…</Grid>
}
```

> Use `manual` when the dataset is too large to ship to the browser. Leave `manual` off for in-memory tables — Lattice's pipeline is cheap and avoids a network round-trip per keystroke.

---

## 7. Hooks

```ts
useGridContext<TData>(): GridInstance<TData>
//   Must be used inside <Grid>. Throws otherwise.

useRowContext<TData>(): { row, rowIndex, isSelected, isExpanded }
//   Must be used inside a row rendered by <Grid.Body>. Throws otherwise.

usePlugin<T = any>(id: string): T
//   Short for useGridContext().getPlugin<T>(id). Throws if plugin not installed.

useGrid<TData>(args): GridInstance<TData>
//   Low-level: build a grid instance OUTSIDE the <Grid> component
//   (for fully-custom rendering). See §11 Headless mode.

useLiveRegion(): { announce(msg, priority?: 'polite' | 'assertive') }
//   Send SR announcements through the grid's live region. Safe outside a provider
//   (returns a no-op). <Grid> auto-installs <LiveRegionProvider>.

useGridKeyboardContext(): { enabled, activeCell, setActiveCell, isInteracting, setInteracting }
//   Read the keyboard-nav state. Useful for custom cells that need to know
//   whether the user is navigating vs. interacting with a cell editor.
```

### `GridInstance<TData>` (what hooks return)

```ts
type GridInstance<TData> = {
  rawRows: TData[]
  sortedRows: TData[]
  filteredRows: TData[]
  paginatedRows: TData[]
  rows: TData[]                                    // === paginatedRows
  columns: ColumnDef<TData>[]
  state: GridState<TData>
  dispatch: (action: GridAction<TData>) => void
  getRowKey: (row: TData) => string | number
  isSelected: (row: TData) => boolean
  isExpanded: (row: TData) => boolean
  getGridProps(): any                              // spread on root div
  getHeaderProps(): any
  getRowProps(row, index): any
  getCellProps(columnKey?): any
  getStickyProps(columnKey?): { style?, 'data-lattice-sticky'? }  // sticky/pinned cols
  getPlugin<T>(id: string): T
  hasPlugin(id: string): boolean
  totalRows: number                                // rowCount ?? rawRows.length
  totalFilteredRows: number                        // rowCount ?? filteredRows.length
  totalPages: number
}
```

---

## 8. State & Actions

`GridState<TData>`:

```ts
type GridState<TData> = {
  data: TData[]
  sortState: { key: ColumnKey<TData>; direction: 'asc' | 'desc' }[]
  globalFilter: string
  columnFilters: Partial<Record<ColumnKey<TData>, string>>
  currentPage: number                       // 0-indexed
  pageSize: number
  selectedKeys: Set<string | number>
  expandedKeys: Set<string | number>
  isLoading: boolean
}
```

`GridAction<TData>` (dispatch-able via `grid.dispatch(...)`):

```ts
{ type: 'SET_DATA'; payload: TData[] }
{ type: 'SET_LOADING'; payload: boolean }
{ type: 'SET_SORT'; payload: SortState<TData>[] }
{ type: 'SET_GLOBAL_FILTER'; payload: string }
{ type: 'SET_COLUMN_FILTER'; payload: { key; value } }
{ type: 'CLEAR_COLUMN_FILTERS' }
{ type: 'SET_PAGE'; payload: number }
{ type: 'SET_PAGE_SIZE'; payload: number }
{ type: 'TOGGLE_SELECT'; payload: string | number }    // pass the rowKey value
{ type: 'SELECT_ALL'; payload: (string | number)[] }
{ type: 'CLEAR_SELECTION' }
{ type: 'TOGGLE_EXPAND'; payload: string | number }
{ type: 'RESET'; payload: TData[] }
```

**Idiomatic usage:** most of the time you should *use the plugin API* (`sort.toggleSort`, `filter.setGlobalFilter`, `p.goToPage`). Only reach for `dispatch` for selection/expansion/loading, or when writing your own plugin.

---

## 9. Styling

Lattice ships **no styles** — you style the grid yourself. Lattice emits `data-*` attributes you can hook into:

| Attribute             | Where                         | Use for                       |
|-----------------------|-------------------------------|-------------------------------|
| `[data-lattice-grid]` | `<Grid>` root div             | border, shadow, background    |
| `[data-lattice-header]` | `<Grid.Header>` wrapper     | sticky header styling         |
| `[data-lattice-body]` | `<Grid.Body>` wrapper         | scroll container              |
| `[data-lattice-footer]` | `<Grid.Footer>` wrapper     | footer bar                    |
| `[data-lattice-row]`  | each rendered row             | hover, borders                |
| `[data-lattice-cell]` | each `<Cell>`                 | padding, truncation           |
| `[data-selected]`     | on `[data-lattice-row]`       | selected-row background       |
| `[data-expanded]`     | on `[data-lattice-row]`       | expanded-row styling          |
| `[data-overflow]`     | on `[data-lattice-cell]`      | `ellipsis` / `wrap` / `clip`  |

### Recommended CSS variables (convention, not enforced)

```css
:root {
  --lattice-brand: #6366f1;
  --lattice-bg: #fff;
  --lattice-surface: #f9fafb;
  --lattice-text: #1f2937;
  --lattice-border: #e5e7eb;
  --lattice-hover: #f3f4f6;
  --lattice-selected: #eef2ff;
}
```

### Layout helpers you provide

Lattice does **not** give you a `grid-template-columns`. You own layout. A common pattern is a CSS-grid row class:

```css
.grid-row { display: grid; align-items: center; }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.cell { padding: 0.75rem 1rem; }
```

Or use `buildGridTemplate(columns)` for dynamic widths (see §5).

### Sticky / pinned columns

Set `sticky: 'left' | 'right'` on a `ColumnDef` and Lattice does the rest:

- `<Grid>` auto-wraps its output in a scrollable `role="region"` div.
- `grid.getStickyProps(columnKey)` returns `{ style: { position: 'sticky', left/right: 'Npx' }, 'data-lattice-sticky': 'left' | 'right' }`.
- Left/right offsets are **cumulative** across adjacent pinned columns when `width` is a number.

`<Grid.HeaderCell>` applies these automatically. For hand-rolled cells, spread `getStickyProps(key)` yourself:

```tsx
function StickyCell({ columnKey }: { columnKey: keyof Row & string }) {
  const grid = useGridContext<Row>()
  const sticky = grid.getStickyProps(columnKey)
  return <Cell columnKey={columnKey} style={sticky.style} {...sticky} />
}
```

---

## 10. Accessibility

Lattice bakes a11y into the primitives — you rarely have to add ARIA by hand.

### Built in automatically
- **`role="grid"`** on the root, with `aria-rowcount` / `aria-colcount` / `aria-busy`.
- **`role="rowgroup"`** on `Grid.Header` / `Grid.Body` / `Grid.Footer`.
- **`role="row"`** with `aria-rowindex` (computed from the *filtered* set, offset by the presence of a Header).
- **`role="gridcell"`** with `aria-colindex` on every `<Cell>`.
- **WAI-ARIA grid keyboard nav** (arrow keys, Home/End, PageUp/PageDown, F2 to enter cell, Escape to exit) — default on. Disable per-grid with `<Grid keyboard={false}>`.

### Live-region announcements
`<Grid>` auto-wraps in `<LiveRegionProvider>`, and an internal `useLiveAnnouncements` hook announces sort / filter / pagination / selection changes as they happen. To announce your own events from a custom cell or control:

```tsx
import { useLiveRegion } from '@reactzero/lattice/react'

function ExportButton() {
  const { announce } = useLiveRegion()
  return (
    <button onClick={() => { doExport(); announce('Export started', 'polite') }}>
      Export
    </button>
  )
}
```

### Accessible name is required
Pass **`aria-label`** or **`aria-labelledby`** on `<Grid>`. Without one, you get a dev-time `console.warn`. Screen readers need it to identify the grid.

### Use the prop-getters on your chrome
Every plugin exposes `get*Props` / `get*StatusMessage` helpers (see §6.1–6.3). Wiring them up gets you correct `role`, `aria-sort`, `aria-current`, `aria-label`, and keyboard handlers for free — don't hand-roll these.

```tsx
// Headers (preferred: <Grid.HeaderCell>; fallback: direct getter)
const sort = usePlugin<SortPluginAPI<Row>>('sort')
<div {...sort.getSortHeaderProps('name')}>Name</div>

// Filters
const filter = usePlugin<FilterPluginAPI<Row>>('filter')
<input {...filter.getGlobalFilterInputProps('Search employees')} />

// Pagination
const p = usePlugin<PaginatePluginAPI>('paginate')
<nav {...p.getPaginationProps()}>
  <button {...p.getPrevButtonProps()}>Prev</button>
  <button {...p.getNextButtonProps()}>Next</button>
</nav>
```

---

## 11. Recipes

### 11.1 Sortable header

```tsx
function SortableHeader({ columnKey, label }: {
  columnKey: keyof Employee & string; label: string
}) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div
      className="cell sortable-cell"
      role="button"
      tabIndex={0}
      onClick={() => sort.toggleSort(columnKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') sort.toggleSort(columnKey) }}
    >
      {label}<span>{dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ' ↕'}</span>
    </div>
  )
}
```

### 11.2 Global search + per-column filter

```tsx
function GlobalSearch() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <input
      placeholder="Search all columns…"
      onChange={(e) => filter.setGlobalFilter(e.target.value)}
    />
  )
}

function ColumnFilter({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <div>
      <div>{label}</div>
      <input onChange={(e) => filter.setColumnFilter(columnKey, e.target.value)} />
    </div>
  )
}
```

### 11.3 Pagination controls

```tsx
function PaginationControls() {
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="pagination-controls">
      <button onClick={p.goToPrevPage} disabled={!p.hasPrevPage}>Prev</button>
      <span>Page {p.currentPage + 1} of {p.totalPages}</span>
      <button onClick={p.goToNextPage} disabled={!p.hasNextPage}>Next</button>
      <select value={p.pageSize} onChange={(e) => p.setPageSize(Number(e.target.value))}>
        <option value={10}>10 / page</option>
        <option value={25}>25 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  )
}
```

### 11.4 Row selection

```tsx
function SelectCell() {
  const grid = useGridContext<Employee>()
  const { row, isSelected } = useRowContext<Employee>()
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => grid.dispatch({ type: 'TOGGLE_SELECT', payload: grid.getRowKey(row) })}
    />
  )
}

function SelectAll() {
  const grid = useGridContext<Employee>()
  const allKeys = grid.rows.map(grid.getRowKey)
  const allSelected = allKeys.every((k) => grid.state.selectedKeys.has(k))
  return (
    <input
      type="checkbox"
      checked={allSelected}
      onChange={() =>
        allSelected
          ? grid.dispatch({ type: 'CLEAR_SELECTION' })
          : grid.dispatch({ type: 'SELECT_ALL', payload: allKeys })
      }
    />
  )
}
```

### 11.5 Expandable rows + detail panel

```tsx
<Grid data={employees} rowKey="id">
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-4">
        <ExpandToggle />
        <Cell columnKey="name" />
        <Cell columnKey="role" />
        <Cell columnKey="salary" render={(v) => `$${Number(v).toLocaleString()}`} />
      </div>
      <Grid.Detail>
        {(row) => (
          <div className="detail-panel">
            <p>{row.name} has worked on {row.projects?.length ?? 0} projects.</p>
          </div>
        )}
      </Grid.Detail>
    </Row>
  </Grid.Body>
</Grid>

function ExpandToggle() {
  const grid = useGridContext<Employee>()
  const { row, isExpanded } = useRowContext<Employee>()
  return (
    <button
      aria-expanded={isExpanded}
      onClick={() => grid.dispatch({ type: 'TOGGLE_EXPAND', payload: grid.getRowKey(row) })}
    >
      {isExpanded ? '▼' : '▶'}
    </button>
  )
}
```

### 11.6 Custom cell rendering (badge, avatar, link)

```tsx
<Cell
  columnKey="status"
  render={(value) => <span className={`status-badge status-${value}`}>{String(value)}</span>}
/>

<Cell
  columnKey="owner"
  render={(value, ctx) => (
    <a href={`/users/${ctx.row.ownerId}`} className="row-link">
      <img src={ctx.row.avatarUrl} alt="" /> {value}
    </a>
  )}
/>
```

### 11.7 Conditional row styling

```tsx
<Row
  className={({ row, isSelected }) =>
    `grid-row-wrapper ${isSelected ? 'is-selected' : ''} ${row.status === 'inactive' ? 'is-dim' : ''}`
  }
  onClick={(row) => console.log('clicked', row)}
>
  ...
</Row>
```

### 11.8 Empty & loading states

```tsx
<Grid
  data={employees}
  rowKey="id"
  loadingState={<div className="grid-loading">Loading…</div>}
  emptyState={<div className="grid-empty">No employees yet. Add one →</div>}
>
  ...
</Grid>
```

Toggle loading via:

```ts
grid.dispatch({ type: 'SET_LOADING', payload: true })
```

### 11.9 Footer that reads grid state

```tsx
function FooterInfo() {
  const grid = useGridContext()
  return <div>Showing {grid.totalFilteredRows} of {grid.totalRows} rows</div>
}

<Grid.Footer><FooterInfo /></Grid.Footer>
```

---

## 12. Headless / Fully Custom Rendering

If you need to render with `<table>`, a virtual list, or anything else, use `useGrid` to build the instance outside `<Grid>` and then render whatever you want. You still get sort/filter/paginate pipelines for free.

```tsx
import { useGrid } from '@reactzero/lattice/react/hooks'

function CustomTable({ data }: { data: Employee[] }) {
  const grid = useGrid({
    data,
    rowKey: 'id',
    plugins: [sortPlugin<Employee>(), paginatePlugin<Employee>({ pageSize: 20 })],
  })

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => grid.getPlugin<SortPluginAPI<Employee>>('sort').toggleSort('name')}>Name</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {grid.rows.map((row, i) => (
          <tr key={grid.getRowKey(row)}>
            <td>{row.name}</td>
            <td>{row.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## 13. End-to-End Example (sort + filter + paginate + select + expand)

```tsx
import { useMemo } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin, useGridContext, useRowContext } from '@reactzero/lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { filterPlugin, type FilterPluginAPI } from '@reactzero/lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from '@reactzero/lattice/paginate'

type Employee = {
  id: number; name: string; department: string; role: string
  salary: number; status: 'active' | 'inactive' | 'on-leave'
}

export function EmployeeDirectory({ data }: { data: Employee[] }) {
  const plugins = useMemo(() => [
    sortPlugin<Employee>({ multiSort: true }),
    filterPlugin<Employee>({ debounce: 150 }),
    paginatePlugin<Employee>({ pageSize: 10 }),
  ], [])

  return (
    <Grid
      data={data}
      rowKey="id"
      plugins={plugins}
      aria-label="Employee directory"
      emptyState={<div className="empty">No employees match your filters.</div>}
    >
      <Toolbar />
      <Grid.Header>
        <div className="grid-row grid-cols-5 header-row">
          <SelectAll />
          <SortableHeader columnKey="name" label="Name" />
          <SortableHeader columnKey="department" label="Department" />
          <SortableHeader columnKey="role" label="Role" />
          <SortableHeader columnKey="salary" label="Salary" />
        </div>
      </Grid.Header>

      <Grid.Body>
        <Row
          className={({ isSelected }) => isSelected ? 'row row-selected' : 'row'}
        >
          <div className="grid-row grid-cols-5">
            <SelectCell />
            <Cell columnKey="name" />
            <Cell columnKey="department" />
            <Cell columnKey="role" />
            <Cell
              columnKey="salary"
              render={(v) => `$${Number(v).toLocaleString()}`}
            />
          </div>
        </Row>
      </Grid.Body>

      <Grid.Footer>
        <FooterBar />
      </Grid.Footer>
    </Grid>
  )
}

function Toolbar() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  return (
    <div className="toolbar">
      <input
        placeholder="Search…"
        onChange={(e) => filter.setGlobalFilter(e.target.value)}
      />
      <button onClick={() => filter.clearFilters()}>Clear</button>
    </div>
  )
}

function SortableHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
      {label} <span>{dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}</span>
    </div>
  )
}

function SelectAll() {
  const grid = useGridContext<Employee>()
  const keys = grid.rows.map(grid.getRowKey)
  const allSelected = keys.length > 0 && keys.every((k) => grid.state.selectedKeys.has(k))
  return (
    <input
      type="checkbox"
      checked={allSelected}
      onChange={() => grid.dispatch(
        allSelected ? { type: 'CLEAR_SELECTION' } : { type: 'SELECT_ALL', payload: keys }
      )}
    />
  )
}

function SelectCell() {
  const grid = useGridContext<Employee>()
  const { row, isSelected } = useRowContext<Employee>()
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => grid.dispatch({ type: 'TOGGLE_SELECT', payload: grid.getRowKey(row) })}
    />
  )
}

function FooterBar() {
  const grid = useGridContext<Employee>()
  const p = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="footer">
      <span>{grid.state.selectedKeys.size} selected · {grid.totalFilteredRows} of {grid.totalRows}</span>
      <div className="pager">
        <button onClick={p.goToPrevPage} disabled={!p.hasPrevPage}>Prev</button>
        <span>{p.currentPage + 1} / {p.totalPages}</span>
        <button onClick={p.goToNextPage} disabled={!p.hasNextPage}>Next</button>
      </div>
    </div>
  )
}
```

---

## 14. Writing Your Own Plugin

```ts
import type { LatticePlugin } from '@reactzero/lattice/core/types'

export function highlightPlugin<TData>(): LatticePlugin<TData, { pulse: () => void }> {
  return {
    id: 'highlight',
    initialState: {},
    init({ dispatch }) {
      return { pulse: () => dispatch({ type: 'SET_LOADING', payload: true }) }
    },
    processFilteredRows(rows, _state) {
      // transform rows here if you want
      return rows
    },
  }
}
```

Pipeline hook names:
- `processSortedRows(rows, state) → rows`
- `processFilteredRows(rows, state) → rows`
- `processPaginatedRows(rows, state) → rows`

Plugins can also contribute `initialState` and a custom `reducer`. Keep reducers **pure** — they run under React's `useReducer`.

---

## 15. RULES (enforce, do not violate)

These encode real footguns that have broken past implementations.

1. **Install plugins inside `useMemo`** with a stable dep array. Re-creating the plugin array every render resets the grid state on every keystroke.
   ```tsx
   const plugins = useMemo(() => [sortPlugin<Employee>()], [])  // ✅
   const plugins = [sortPlugin<Employee>()]                      // ❌ resets state each render
   ```
2. **`<Grid.Body>` must contain exactly one `<Row>`.** Not zero, not two. The second `<Row>` is silently ignored and Lattice throws on zero.
3. **Never pass `row` or `rowIndex` to `<Cell>` as props.** `<Cell>` reads from `RowContext`. Wrap your cells in a wrapper `<div>` if you want — context still works because Lattice uses `RowContext.Provider`, **not** `cloneElement`.
4. **`rowKey` must resolve to `string | number`.** If `row.id` is `undefined` or `null`, Lattice will throw `rowKey "id" must resolve to string | number`.
5. **Pages are 0-indexed.** Display as `currentPage + 1`.
6. **Plugin IDs are fixed.** `'sort'`, `'filter'`, `'paginate'`. When you call `usePlugin('<id>')` it **will throw** if the plugin isn't installed. Guard with `grid.hasPlugin('sort')` if plugins are dynamic.
7. **`toggleSort` cycles none → asc → desc → none.** If you need a two-state toggle use `setSortBy(key, direction)`.
8. **Filter matches are case-insensitive `includes` over stringified values.** If you need structured filtering (number ranges, dates), provide `ColumnDef.filterFn`.
9. **Layout is yours.** `Grid.Header` / `Grid.Body` / `Grid.Footer` do not enforce any column template. Use CSS grid (`.grid-row { display: grid; grid-template-columns: ... }`) or `buildGridTemplate(columns)`.
10. **Styling is via `data-*` attributes + CSS vars.** Lattice ships zero CSS. Use `[data-lattice-row][data-selected]`, `[data-lattice-cell][data-overflow="ellipsis"]`, etc.
11. **No server-side rendering special case.** `<Grid>` works in SSR because it uses `useReducer` and `useMemo` — just don't access `window` in a `render` prop without guarding.
12. **Never mutate `data`.** Treat props as immutable; dispatch `SET_DATA` if you need to swap the dataset.
13. **For headless custom rendering, use `useGrid`** — do not try to render `<Grid>` with no children, it will throw when `<Grid.Body>` can't find a `<Row>`.
14. **Type your plugins generically.** Always parameterize: `sortPlugin<Employee>()`, `usePlugin<SortPluginAPI<Employee>>('sort')`. Skipping generics gives you `any` and loses `columnKey` safety.
15. **Provide an accessible name on `<Grid>`.** Pass `aria-label` or `aria-labelledby`. Skipping this produces a dev-time warning and makes the grid unnamed for screen readers.
16. **In manual (server-side) mode, set `rowCount`.** Without it, `totalPages` is computed from `data.length` (one page of rows) and pagination breaks. See §6.5.
17. **Prefer prop-getters over hand-rolled ARIA.** `getSortHeaderProps`, `getFilterInputProps`, `getPageButtonProps` emit the correct `role` / `aria-sort` / `aria-current` / `aria-label` / keyboard handlers. If you wire events yourself, you're probably missing one.

---

## 16. Quick Type Cheat-Sheet

```ts
// Columns
type ColumnKey<T> = keyof T & string
type SortDirection = 'asc' | 'desc' | false
type SortFn<T, V> = (a: V, b: V, rowA: T, rowB: T) => number
type FilterFn<T, V> = (value: V, filterValue: string, row: T) => boolean

// Plugin APIs (state + a11y prop-getters + status messages)
type SortPluginAPI<T> = {
  setSortBy(key: ColumnKey<T>, direction: SortDirection): void
  toggleSort(key: ColumnKey<T>): void
  clearSort(): void
  getSortState(): SortState<T>[]
  isSorted(key: ColumnKey<T>): SortDirection
  getSortHeaderProps(key: ColumnKey<T>): SortHeaderProps
  getSortStatusMessage(): string
}

type FilterPluginAPI<T> = {
  setGlobalFilter(v: string): void
  setColumnFilter(key: ColumnKey<T>, v: string): void
  clearFilters(): void
  getGlobalFilter(): string
  getColumnFilter(key: ColumnKey<T>): string
  getGlobalFilterInputProps(label?: string): FilterInputProps
  getFilterInputProps(key: ColumnKey<T>, label: string): FilterInputProps
  getClearFilterProps(label?: string): FilterClearProps
  getFilterStatusMessage(): string
}

type PaginatePluginAPI = {
  goToPage(p: number): void
  goToNextPage(): void
  goToPrevPage(): void
  setPageSize(n: number): void
  readonly currentPage: number
  readonly pageSize: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly hasPrevPage: boolean
  getPaginationProps(label?: string): PaginationProps
  getPageButtonProps(page: number, label?: string): PageButtonProps
  getPrevButtonProps(label?: string): PageButtonProps
  getNextButtonProps(label?: string): PageButtonProps
  getPageSizeSelectProps(label?: string): PageSizeSelectProps
  getPageStatusMessage(): string
}

// Manual-mode snapshots (payload to onFilterChange / onPaginationChange)
type FilterSnapshot<T> = { globalFilter: string; columnFilters: Partial<Record<ColumnKey<T>, string>> }
type PaginationSnapshot = { currentPage: number; pageSize: number }
```

---

## 17. Troubleshooting Matrix

| Symptom                                                                 | Likely cause / fix                                                                    |
|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `Error: <Grid.Body> must contain exactly one <Row> child`               | You rendered zero or 2+ `<Row>` elements. Wrap in a single `<Row>`.                   |
| `Error: rowKey "X" must resolve to string \| number`                    | `row[rowKey]` is `undefined`/`null`/object. Fix the data or change `rowKey`.          |
| `useGridContext must be used inside a <Grid>`                           | Component is not rendered as a descendant of `<Grid>`.                                |
| `useRowContext must be used inside a <Grid.Body> row`                   | Component is outside `<Grid.Body>` or above the `<Row>`.                              |
| `Plugin X not found`                                                    | Forgot to include plugin in the `plugins={[...]}` array.                              |
| Sort/filter/paginate resets on every keystroke                          | Plugin array not memoized. Wrap in `useMemo(() => [...], [])`.                        |
| Cell shows `undefined`                                                  | `columnKey` typo, or `getValue` returns undefined. Add `render` fallback.             |
| Filter input feels laggy                                                | Debounce is 200ms by default. Pass `filterPlugin({ debounce: 50 })` to speed it up.   |
| Expanded row does not render                                            | Missing `<Grid.Detail>` inside `<Row>` **and** `TOGGLE_EXPAND` not dispatched.        |
| TypeScript: `.props` typed as `unknown`                                 | React 19 `@types/react`. Cast explicitly when using `cloneElement`/`isValidElement`.  |
| Console warn: `<Grid> requires an accessible name`                      | Pass `aria-label` or `aria-labelledby` on `<Grid>`.                                   |
| Pagination shows `1 / 1` despite many server rows                       | Manual mode without `rowCount` prop. Add `<Grid rowCount={serverTotal}>`.             |
| Arrow keys don't move focus between cells                               | Either `keyboard={false}` was passed, or the `<Grid>` root lost focus. Click a cell first. |
| Screen reader doesn't announce sort / filter / page changes            | `<Grid>` installs a live region automatically — make sure you didn't render outside `<Grid>`, and don't disable ARIA roles on your wrapper. |
| Pinned column scrolls with the others                                   | `ColumnDef.sticky` not set, or cell doesn't spread `grid.getStickyProps(key)`. Prefer `<Grid.HeaderCell>`. |

---

## 18. When in doubt

1. Start from §13 (end-to-end example) and delete what you don't need.
2. Use `useMemo` on `plugins`.
3. Use `usePlugin('<id>')` to read/set state, not raw `dispatch`, unless you need selection / expansion / loading.
4. Style via CSS vars + `data-*` attributes.
5. Type every plugin and hook generically.

That's the whole library. Now build the table.
