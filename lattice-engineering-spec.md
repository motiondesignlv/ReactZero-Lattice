# Lattice — Engineering Specification
### `reactzero-lattice/react` · Complete Build Reference

> This document is the single source of truth for building Lattice.
> Every section maps to real implementation decisions, TypeScript patterns,
> and architectural reasoning. Use it to move fast without second-guessing.

---

## TABLE OF CONTENTS

1. [Core Philosophy & Design Decisions](#1-core-philosophy--design-decisions)
2. [Repository Structure — npm workspaces](#2-repository-structure--npm-workspaces)
3. [Build Tooling](#3-build-tooling)
4. [TypeScript Architecture](#4-typescript-architecture)
5. [Core Engine — Data Pipeline](#5-core-engine--data-pipeline)
6. [Component Layer — Cell / Row / Grid](#6-component-layer--cell--row--grid)
7. [Context System](#7-context-system)
8. [Hooks API](#8-hooks-api)
9. [Plugin System](#9-plugin-system)
10. [CSS Architecture — data-* attribute system](#10-css-architecture--data--attribute-system)
11. [Accessibility Implementation](#11-accessibility-implementation)
12. [Built-in Plugins — Full Spec](#12-built-in-plugins--full-spec)
13. [DevTools Panel](#13-devtools-panel)
14. [Interactive Playground](#14-interactive-playground)
15. [Beyond Tables — Examples Gallery](#15-beyond-tables--examples-gallery)
16. [Docs Site — React Landing Page](#16-docs-site--react-landing-page)
17. [Storybook + Chromatic](#17-storybook--chromatic)
18. [Testing Strategy](#18-testing-strategy)
19. [Release Process](#19-release-process)

---

## 1. Core Philosophy & Design Decisions

### 1.1 The mental model — why cell-first beats column-first

Every existing table library (TanStack, AG Grid, React Table v7) is **column-centric**:
you define columns as config objects, the library loops over them per row.

Lattice inverts this: you define **one row template** with typed cells,
and the engine loops the row over data. This mirrors how humans think about tables:
"I want each row to look like this."

```
Column-centric (TanStack approach):
  columns = [{ key: 'name', render: ... }, { key: 'email' }]
  → Library iterates columns to produce each cell in each row

Cell-centric (Lattice approach):
  <Row>
    <Cell columnKey="name" render={...} />
    <Cell columnKey="email" />
  </Row>
  → Library loops the Row over data
```

The cell-centric model produces more readable JSX, is more composable,
and maps directly to how CSS Grid / Flexbox layouts are thought about.

### 1.2 Design decisions and their rationale

| Decision | Why |
|---|---|
| Zero runtime dependencies | Forces us to build light, keeps consumer bundle clean |
| `data-*` attributes only for styling | CSS-first, no className merging logic, no runtime style injection |
| Plugin array composition | Order matters in data pipelines — array makes this explicit |
| `ColumnDef<TData>` optional | You can drive everything from JSX `<Cell>` children alone |
| Single Row template | Forces the "database schema" mental model, reduces API surface |
| `useReducer` for all state | Concurrent-safe, predictable, testable, no external state lib |
| Render props + Context dual API | Headless hook API AND JSX component API — both fully typed |
| `display: contents` on Row | Lets CSS Grid / Flexbox flow through the component boundary |

### 1.3 What Lattice is NOT responsible for

- Styling (zero CSS shipped)
- Data fetching (use TanStack Query, SWR, etc.)
- Form editing within cells (consumer handles)
- Column resizing drag handles (opt-in via future plugin)
- Virtualisation in core (opt-in via `reactzero-lattice/virtual` plugin)

---

## 2. Repository Structure — npm workspaces

### 2.1 Root package.json

```json
{
  "name": "lattice",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build":        "npm run build --workspaces --if-present",
    "build:watch":  "npm run build:watch --workspaces --if-present",
    "test":         "npm run test --workspaces --if-present",
    "test:coverage":"npm run test:coverage --workspaces --if-present",
    "lint":         "eslint packages --ext .ts,.tsx",
    "typecheck":    "tsc --noEmit --project tsconfig.json",
    "changeset":    "changeset",
    "version":      "changeset version",
    "release":      "changeset publish"
  },
  "devDependencies": {
    "@changesets/cli":       "^2.27.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint":                "^9.0.0",
    "typescript":            "^6.0.0",
    "vitest":                "^2.0.0",
    "tsup":                  "^8.0.0"
  }
}
```

### 2.2 Full directory tree

```
lattice/
├── package.json                   # root — npm workspaces
├── tsconfig.base.json             # shared TS config
├── tsconfig.json                  # root typecheck (references all)
├── .changeset/
│   └── config.json
│
├── packages/
│   ├── core/                      # reactzero-lattice/core — zero React, pure TS
│   │   ├── src/
│   │   │   ├── engine.ts          # pipeline: sort → filter → paginate
│   │   │   ├── types.ts           # ALL shared types live here
│   │   │   ├── utils/
│   │   │   │   ├── sort.ts        # default sort comparators
│   │   │   │   ├── filter.ts      # default filter predicates
│   │   │   │   └── key.ts         # row key extraction helpers
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── react/                     # reactzero-lattice/react — React bindings
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Grid.tsx
│   │   │   │   ├── Row.tsx
│   │   │   │   ├── Cell.tsx
│   │   │   │   ├── Header.tsx     # Grid.Header slot
│   │   │   │   ├── Body.tsx       # Grid.Body slot
│   │   │   │   └── Footer.tsx     # Grid.Footer slot
│   │   │   ├── hooks/
│   │   │   │   ├── useGrid.ts     # headless hook — full API
│   │   │   │   ├── useRow.ts
│   │   │   │   ├── useCell.ts
│   │   │   │   └── usePlugin.ts   # access any plugin by id
│   │   │   ├── context.tsx        # GridContext + GridProvider
│   │   │   ├── config.ts          # defineConfig helper
│   │   │   └── index.ts           # public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sort/                      # reactzero-lattice/sort
│   │   ├── src/
│   │   │   ├── plugin.ts          # sortPlugin factory
│   │   │   ├── SortHeader.tsx     # optional pre-built sort header cell
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── filter/                    # reactzero-lattice/filter
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── FilterInput.tsx    # optional pre-built filter input
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── paginate/                  # reactzero-lattice/paginate
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── components/
│   │   │   │   ├── NumericPagination.tsx
│   │   │   │   ├── ArrowPagination.tsx
│   │   │   │   └── InfinitePagination.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── select/                    # reactzero-lattice/select
│   ├── expand/                    # reactzero-lattice/expand
│   ├── group/                     # reactzero-lattice/group (v2)
│   ├── virtual/                   # reactzero-lattice/virtual (v2)
│   │
│   └── devtools/                  # reactzero-lattice/devtools
│       ├── src/
│       │   ├── DevtoolsPanel.tsx
│       │   ├── panels/
│       │   │   ├── StatePanel.tsx
│       │   │   ├── PipelinePanel.tsx
│       │   │   ├── PerformancePanel.tsx
│       │   │   └── PluginPanel.tsx
│       │   └── index.ts
│       └── package.json
│
└── apps/
    ├── docs/                      # docs landing page (Next.js 15)
    │   ├── app/
    │   ├── components/
    │   └── package.json
    │
    └── playground/                # play.lattice.dev (Vite + React)
        ├── src/
        └── package.json
```

### 2.3 Individual package.json pattern

Every package follows the same shape. This is critical for tree-shaking and dual CJS/ESM output:

```json
{
  "name": "reactzero-lattice/react",
  "version": "0.1.0",
  "description": "Composable grid engine for React",
  "type": "module",
  "main":    "./dist/index.cjs",
  "module":  "./dist/index.js",
  "types":   "./dist/index.d.ts",
  "exports": {
    ".": {
      "import":  "./dist/index.js",
      "require": "./dist/index.cjs",
      "types":   "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "peerDependencies": {
    "react":     ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "reactzero-lattice/core": "workspace:*",
    "react":         "^19.0.0",
    "react-dom":     "^19.0.0",
    "typescript":    "^6.0.0",
    "tsup":          "^8.0.0",
    "vitest":        "^2.0.0"
  },
  "scripts": {
    "build":      "tsup",
    "build:watch":"tsup --watch",
    "test":       "vitest run",
    "typecheck":  "tsc --noEmit"
  }
}
```

### 2.4 tsup config per package

```ts
// packages/react/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry:      ['src/index.ts'],
  format:     ['esm', 'cjs'],
  dts:        true,
  splitting:  true,         // per-chunk code splitting for tree-shaking
  sourcemap:  true,
  clean:      true,
  treeshake:  true,
  external:   ['react', 'react-dom', 'reactzero-lattice/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic'  // React 17+ JSX transform
  }
})
```

### 2.5 Shared tsconfig.base.json

```json
{
  "compilerOptions": {
    "strict":                    true,
    "target":                    "ES2022",
    "module":                    "ESNext",
    "moduleResolution":          "bundler",
    "lib":                       ["ES2022", "DOM", "DOM.Iterable"],
    "jsx":                       "react-jsx",
    "declaration":               true,
    "declarationMap":            true,
    "sourceMap":                 true,
    "esModuleInterop":           true,
    "skipLibCheck":              true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess":  true,
    "noImplicitOverride":        true,
    "verbatimModuleSyntax":      true
  }
}
```

**Key flags explained:**

- `exactOptionalPropertyTypes` — `{ foo?: string }` means `undefined` is not a valid explicit value. Prevents `{ foo: undefined }` from sneaking in.
- `noUncheckedIndexedAccess` — `arr[0]` returns `T | undefined`, not `T`. Forces you to handle missing indices.
- `verbatimModuleSyntax` — enforces `import type` for type-only imports. Required for correct ESM output.
- `moduleResolution: "bundler"` — correct for tsup/Vite/esbuild without the old `node16` import extension requirements.

---

## 3. Build Tooling

### 3.1 Why tsup

- Wraps esbuild — near-instant builds
- Native dual ESM+CJS output in one command
- Automatic `.d.ts` generation via `tsc` pass
- `splitting: true` enables proper chunk splitting for tree-shaking sub-exports
- Used by TanStack, Radix, Zustand — battle-tested for this exact use case

### 3.2 Why Vite for playground

- HMR for the interactive playground
- First-class React support
- WebAssembly support for in-browser TypeScript compilation (Monaco + ts-morph)

### 3.3 Why Next.js 15 for docs

- App Router for MDX-based documentation
- React Server Components for zero-JS navigation
- Fast static export for Vercel/Cloudflare deployment
- `next-mdx-remote` or `@next/mdx` for documentation pages

---

## 4. TypeScript Architecture

This section is the most important part of the spec. Get the types right first —
the implementation follows.

### 4.1 The TData generic — foundation of everything

`TData` is the single generic that flows through the entire system.
Every consumer-facing API is parameterized on `TData`.

```ts
// packages/core/src/types.ts

// The row key — must be a key of TData that maps to a primitive
export type RowKey<TData> = {
  [K in keyof TData]: TData[K] extends string | number | symbol ? K : never
}[keyof TData]

// Column key — constrained to keyof TData
export type ColumnKey<TData> = keyof TData & string
```

### 4.2 ColumnDef — the column configuration type

```ts
// packages/core/src/types.ts

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

export type ColumnDef<TData, TValue = TData[keyof TData]> = {
  // Required: ties the column to a key on TData
  key: ColumnKey<TData>

  // Display
  header?: string | (() => React.ReactNode)
  footer?: string | (() => React.ReactNode)

  // Value extraction — defaults to row[key]
  getValue?: (row: TData) => TValue

  // Custom render — column-level default (Cell render prop overrides this)
  render?: (value: TValue, context: CellContext<TData>) => React.ReactNode

  // Sort
  enableSort?:  boolean
  sortFn?:      SortFn<TData, TValue>

  // Filter
  enableFilter?:  boolean
  filterFn?:      FilterFn<TData, TValue>

  // Layout
  width?:    number | string   // CSS value, passed as data-width attr
  minWidth?: number
  maxWidth?: number
  sticky?:   'left' | 'right'

  // Consumer-defined metadata — strongly typed via module augmentation
  meta?: ColumnMeta
}

// Module augmentation — consumers extend this to type their meta
// packages/core/src/types.ts
export interface ColumnMeta {}
// In consumer code:
// declare module 'reactzero-lattice/core' {
//   interface ColumnMeta { align?: 'left' | 'right' | 'center' }
// }
```

### 4.3 CellContext — the context object injected into every render function

This is what makes Lattice composable: every cell has full access to the grid,
the row, its value, and all active plugins.

```ts
export type CellContext<TData> = {
  // The full row object
  row: TData
  rowIndex: number
  rowKey: string | number

  // This cell's value (after getValue)
  value: TData[keyof TData]

  // Column definition for this cell
  column: ColumnDef<TData>

  // Row state
  isSelected:  boolean
  isExpanded:  boolean
  isLoading:   boolean

  // Access to the full grid instance
  grid: GridInstance<TData>
}
```

### 4.4 GridState — all mutable state in one place

Using a single state object with `useReducer` makes the entire grid state
serializable, debuggable, and testable:

```ts
export type SortState<TData> = {
  key:       ColumnKey<TData>
  direction: 'asc' | 'desc'
}

export type GridState<TData> = {
  // Core
  data: TData[]

  // Sort (managed by sort plugin)
  sortState: SortState<TData>[]  // array for multi-sort support

  // Filter (managed by filter plugin)
  globalFilter:  string
  columnFilters: Record<ColumnKey<TData>, string>

  // Pagination (managed by paginate plugin)
  currentPage:  number
  pageSize:     number

  // Selection (managed by select plugin)
  selectedKeys: Set<string | number>

  // Expand (managed by expand plugin)
  expandedKeys: Set<string | number>

  // Loading
  isLoading: boolean
}
```

### 4.5 GridAction — the reducer action union

```ts
export type GridAction<TData> =
  | { type: 'SET_DATA';          payload: TData[] }
  | { type: 'SET_LOADING';       payload: boolean }
  | { type: 'SET_SORT';          payload: SortState<TData>[] }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_COLUMN_FILTER'; payload: { key: ColumnKey<TData>; value: string } }
  | { type: 'SET_PAGE';          payload: number }
  | { type: 'SET_PAGE_SIZE';     payload: number }
  | { type: 'TOGGLE_SELECT';     payload: string | number }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_EXPAND';     payload: string | number }
  | { type: 'RESET' }
  // Plugin-defined actions — via module augmentation
  | PluginAction
```

### 4.6 GridInstance — the public API surface

```ts
export type GridInstance<TData> = {
  // Derived data (post-pipeline)
  rawRows:        TData[]
  sortedRows:     TData[]
  filteredRows:   TData[]
  paginatedRows:  TData[]
  rows:           TData[]   // alias for paginatedRows — what you render

  // Column metadata
  columns: ColumnDef<TData>[]

  // State
  state:    GridState<TData>
  dispatch: (action: GridAction<TData>) => void

  // Row helpers
  getRowKey:   (row: TData) => string | number
  isSelected:  (row: TData) => boolean
  isExpanded:  (row: TData) => boolean

  // ARIA prop getters (see section 11)
  getGridProps:    () => React.HTMLAttributes<HTMLElement>
  getHeaderProps:  (columnKey: ColumnKey<TData>) => React.ThHTMLAttributes<HTMLTableCellElement>
  getRowProps:     (row: TData, index: number) => React.HTMLAttributes<HTMLElement>
  getCellProps:    (columnKey: ColumnKey<TData>, row: TData) => React.TdHTMLAttributes<HTMLTableCellElement>

  // Plugin access
  getPlugin: <TPlugin extends LatticePlugin<TData>>(id: string) => ReturnType<TPlugin['init']>
  hasPlugin: (id: string) => boolean

  // Total counts
  totalRows:         number
  totalFilteredRows: number
  totalPages:        number
}
```

### 4.7 Plugin type — the Lego interface

```ts
export type LatticePlugin<
  TData,
  TState extends object = {},
  TActions extends GridAction<TData> = never
> = {
  id: string

  // Called once during grid initialization
  // Returns the plugin's contribution to the GridInstance
  init: (options: PluginInitOptions<TData>) => TState

  // Data pipeline hooks — each transforms the row array
  // These run in the order plugins are declared in the array
  processSortedRows?:    (rows: TData[], state: GridState<TData>) => TData[]
  processFilteredRows?:  (rows: TData[], state: GridState<TData>) => TData[]
  processPaginatedRows?: (rows: TData[], state: GridState<TData>) => TData[]

  // State extension — plugin adds fields to GridState
  initialState?: Partial<GridState<TData>>

  // Reducer extension — plugin handles its own actions
  reducer?: (state: GridState<TData>, action: TActions) => GridState<TData>
}

export type PluginInitOptions<TData> = {
  grid:     GridInstance<TData>
  columns:  ColumnDef<TData>[]
  dispatch: (action: GridAction<TData>) => void
}
```

### 4.8 Smart use of TypeScript 6.0 features

**`using` keyword for cleanup in hooks:**

```ts
// TypeScript 6.0 explicit resource management
// Perfect for DevTools subscriptions, event listeners

import { useEffect } from 'react'

function useGridEventListener(
  grid: GridInstance<unknown>,
  event: string,
  handler: () => void,
) {
  useEffect(() => {
    grid.addEventListener(event, handler)
    return () => grid.removeEventListener(event, handler)
  }, [grid, event, handler])
}

// Internal usage with 'using' for disposable resources:
function createGridSubscription<TData>(grid: GridInstance<TData>) {
  const listeners = new Set<() => void>()

  return {
    subscribe: (fn: () => void) => { listeners.add(fn); return fn },
    notify:    () => listeners.forEach(fn => fn()),
    [Symbol.dispose]: () => listeners.clear(),  // TS 6.0 Disposable
  }
}
```

**Template literal types for column key paths (planned v1.1):**

```ts
// Nested key access — "address.city", "meta.tags.0"
type NestedKeyOf<T, Prefix extends string = ''> =
  T extends object
    ? {
        [K in keyof T & string]:
          | `${Prefix}${K}`
          | NestedKeyOf<T[K], `${Prefix}${K}.`>
      }[keyof T & string]
    : never

// Example:
type UserKeys = NestedKeyOf<{
  name: string
  address: { city: string; zip: string }
}>
// "name" | "address" | "address.city" | "address.zip"
```

**Const type parameters for column key inference:**

```ts
// Utility to create typed column defs with full inference
function createColumns<TData>() {
  return function <const TKey extends ColumnKey<TData>>(
    key: TKey,
    options?: Omit<ColumnDef<TData>, 'key'>
  ): ColumnDef<TData> {
    return { key, ...options }
  }
}

// Usage:
const col = createColumns<User>()
const columns = [
  col('name',  { header: 'Full Name', enableSort: true }),
  col('email', { enableFilter: true }),
  col('role'),
  // col('typo') ← TypeScript error: '"typo"' is not assignable to 'keyof User'
]
```

---

## 5. Core Engine — Data Pipeline

### 5.1 The pipeline concept

The engine is a pure function chain. Plugins tap into specific stages:

```
raw data (TData[])
      ↓
 [sort plugin]        processFilteredRows? runs here after sort
      ↓
 [filter plugin]      processFilteredRows?
      ↓
 [paginate plugin]    processPaginatedRows?
      ↓
rendered rows
```

Critically: **the pipeline is recomputed on every state change using `useMemo`**.
This is fast for datasets up to ~50,000 rows. Virtualisation handles beyond that.

### 5.2 Engine implementation

```ts
// packages/core/src/engine.ts

export type PipelineStage = 'sort' | 'filter' | 'paginate'

export function runPipeline<TData>(
  data:    TData[],
  state:   GridState<TData>,
  plugins: LatticePlugin<TData>[],
): {
  sortedRows:    TData[]
  filteredRows:  TData[]
  paginatedRows: TData[]
} {
  // Stage 1: Sort
  let sortedRows = [...data]
  for (const plugin of plugins) {
    if (plugin.processSortedRows) {
      sortedRows = plugin.processSortedRows(sortedRows, state)
    }
  }

  // Stage 2: Filter
  let filteredRows = [...sortedRows]
  for (const plugin of plugins) {
    if (plugin.processFilteredRows) {
      filteredRows = plugin.processFilteredRows(filteredRows, state)
    }
  }

  // Stage 3: Paginate
  let paginatedRows = [...filteredRows]
  for (const plugin of plugins) {
    if (plugin.processPaginatedRows) {
      paginatedRows = plugin.processPaginatedRows(paginatedRows, state)
    }
  }

  return { sortedRows, filteredRows, paginatedRows }
}
```

### 5.3 The reducer

```ts
// packages/react/src/hooks/useGridReducer.ts

function gridReducer<TData>(
  state:  GridState<TData>,
  action: GridAction<TData>,
  plugins: LatticePlugin<TData>[],
): GridState<TData> {
  // Built-in actions
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload, currentPage: 0 }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_SORT':
      return { ...state, sortState: action.payload, currentPage: 0 }

    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload, currentPage: 0 }

    case 'SET_COLUMN_FILTER':
      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload.key]: action.payload.value,
        },
        currentPage: 0,
      }

    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }

    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 0 }

    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedKeys)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, selectedKeys: next }
    }

    case 'SELECT_ALL': {
      // Handled by select plugin which injects the full key list
      return state
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedKeys: new Set() }

    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedKeys)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, expandedKeys: next }
    }

    case 'RESET':
      return initialGridState()
  }

  // Delegate to plugin reducers for plugin-specific actions
  let nextState = state
  for (const plugin of plugins) {
    if (plugin.reducer) {
      nextState = plugin.reducer(nextState, action as never)
    }
  }
  return nextState
}
```

---

## 6. Component Layer — Cell / Row / Grid

### 6.1 Grid — the parent orchestrator

```tsx
// packages/react/src/components/Grid.tsx

import { useReducer, useMemo, useCallback, type ReactNode } from 'react'
import { GridContext }    from '../context'
import { gridReducer }    from '../hooks/useGridReducer'
import { runPipeline }    from 'reactzero-lattice/core'
import { initialGridState } from '../utils/state'
import type {
  ColumnDef,
  GridProps,
  LatticePlugin,
  RowKey,
} from 'reactzero-lattice/core'

function Grid<TData>({
  data,
  columns = [],
  plugins = [],
  rowKey,
  children,
  'aria-label':     ariaLabel,
  'aria-labelledby':ariaLabelledBy,
  emptyState,
  loadingState,
  ...htmlProps
}: GridProps<TData>) {

  // Initialize plugin states into the initial state
  const initial = useMemo(() => {
    return plugins.reduce((acc, plugin) => ({
      ...acc,
      ...plugin.initialState,
    }), initialGridState<TData>(data))
  }, [])  // intentionally empty — only runs once

  const [state, rawDispatch] = useReducer(
    (s: GridState<TData>, a: GridAction<TData>) =>
      gridReducer(s, a, plugins),
    initial,
  )

  // Stable dispatch reference
  const dispatch = useCallback(rawDispatch, [])

  // Run the data pipeline
  const { sortedRows, filteredRows, paginatedRows } = useMemo(
    () => runPipeline(data, state, plugins),
    [data, state, plugins],
  )

  // Derive total counts
  const totalRows         = data.length
  const totalFilteredRows = filteredRows.length
  const totalPages        = Math.ceil(totalFilteredRows / state.pageSize)

  // Row key extractor
  const getRowKey = useCallback((row: TData): string | number => {
    const val = row[rowKey]
    if (typeof val === 'string' || typeof val === 'number') return val
    throw new Error(`[Lattice] rowKey "${String(rowKey)}" must resolve to string | number`)
  }, [rowKey])

  // Build GridInstance
  const grid: GridInstance<TData> = useMemo(() => ({
    rawRows:        data,
    sortedRows,
    filteredRows,
    paginatedRows,
    rows:           paginatedRows,
    columns,
    state,
    dispatch,
    getRowKey,
    isSelected:  (row) => state.selectedKeys.has(getRowKey(row)),
    isExpanded:  (row) => state.expandedKeys.has(getRowKey(row)),
    totalRows,
    totalFilteredRows,
    totalPages,
    // ARIA prop getters — see section 11
    getGridProps:   () => ({ role: 'grid', 'aria-label': ariaLabel, 'aria-rowcount': totalRows }),
    getHeaderProps: (key) => ({ role: 'columnheader', scope: 'col' }),
    getRowProps:    (row, i) => ({
      role:          'row',
      'aria-rowindex': i + 2,  // +2 because header is row 1
      'aria-selected': state.selectedKeys.has(getRowKey(row)) || undefined,
    }),
    getCellProps: (key, row) => ({ role: 'gridcell' }),
    getPlugin:   (id) => {
      const plugin = plugins.find(p => p.id === id)
      if (!plugin) throw new Error(`[Lattice] Plugin "${id}" not found`)
      return plugin.init({ grid: grid as GridInstance<TData>, columns, dispatch })
    },
    hasPlugin: (id) => plugins.some(p => p.id === id),
  }), [data, sortedRows, filteredRows, paginatedRows, state, columns, plugins])

  return (
    <GridContext.Provider value={grid as GridInstance<unknown>}>
      <div
        data-lattice-grid
        {...grid.getGridProps()}
        {...htmlProps}
      >
        {state.isLoading && loadingState
          ? loadingState
          : paginatedRows.length === 0 && emptyState
            ? emptyState
            : children
        }
      </div>
    </GridContext.Provider>
  )
}

// Static slot components
Grid.Header = Header
Grid.Body   = Body
Grid.Footer = Footer

export { Grid }
```

### 6.2 Row — the template loop

```tsx
// packages/react/src/components/Row.tsx
//
// KEY INSIGHT: Row does NOT render itself. It provides a template.
// Grid.Body uses the Row's children as a template and clones/loops them.
// This is the "one row, many renders" pattern.

import { useContext, type ReactNode, type CSSProperties } from 'react'
import { GridContext } from '../context'
import type { RowClassFn, RowStyleFn, GridInstance } from 'reactzero-lattice/core'

type RowProps<TData> = {
  children:   ReactNode
  className?: string | RowClassFn<TData>
  style?:     CSSProperties | RowStyleFn<TData>
  onClick?:   (row: TData, index: number) => void
  onMouseEnter?: (row: TData, index: number) => void
  [key: `data-${string}`]: unknown  // allow any data-* attribute
}

// The Row component is a template descriptor, not a renderer.
// It stores its props on a symbol so Grid.Body can read them.
export const ROW_TEMPLATE = Symbol('lattice.row.template')

function Row<TData>(props: RowProps<TData>) {
  // Row is never rendered directly — it's used as a template by Grid.Body.
  // In development, warn if rendered outside of Grid.Body.
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Lattice] <Row> should only be used inside <Grid.Body>')
  }
  return null
}
```

### 6.3 Grid.Body — where the loop actually happens

```tsx
// packages/react/src/components/Body.tsx

import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { useGridContext } from '../hooks/useGridContext'

function Body<TData>({ children }: { children: ReactNode }) {
  const grid = useGridContext<TData>()

  // Find the <Row> child (there should be exactly one per Body)
  const rowTemplate = Children.toArray(children).find(
    child => isValidElement(child) && (child.type as { displayName?: string }).displayName === 'LatticeRow'
  )

  if (!rowTemplate || !isValidElement(rowTemplate)) {
    throw new Error('[Lattice] <Grid.Body> must contain exactly one <Row> child')
  }

  const rowProps = rowTemplate.props as RowProps<TData>

  return (
    <div role="rowgroup" data-lattice-body>
      {grid.rows.map((row, index) => {
        const rowKey = grid.getRowKey(row)
        const isSelected = grid.isSelected(row)
        const isExpanded = grid.isExpanded(row)

        const resolvedClassName =
          typeof rowProps.className === 'function'
            ? rowProps.className({ row, rowIndex: index, isSelected, isExpanded })
            : rowProps.className

        const resolvedStyle =
          typeof rowProps.style === 'function'
            ? rowProps.style({ row, rowIndex: index })
            : rowProps.style

        return (
          <div
            key={rowKey}
            role="row"
            data-lattice-row
            data-row-index={index}
            data-selected={isSelected || undefined}    // omit attr when false
            data-expanded={isExpanded || undefined}
            className={resolvedClassName}
            style={resolvedStyle}
            onClick={() => rowProps.onClick?.(row, index)}
            {...grid.getRowProps(row, index)}
          >
            {/* Clone each Cell child, injecting row context */}
            {Children.map(rowTemplate.props.children, (cell) => {
              if (!isValidElement(cell)) return cell
              return cloneElement(cell as React.ReactElement<CellProps<TData>>, {
                _row:        row,
                _rowIndex:   index,
                _isSelected: isSelected,
                _isExpanded: isExpanded,
              })
            })}
          </div>
        )
      })}
    </div>
  )
}
```

### 6.4 Cell — the atomic unit

```tsx
// packages/react/src/components/Cell.tsx

import { useGridContext } from '../hooks/useGridContext'
import type { CellType, ColumnKey, CellContext } from 'reactzero-lattice/core'

type CellProps<TData> = {
  type?:       CellType  // 'data' | 'action' | 'header' | 'divider' | 'skeleton' | 'custom'
  columnKey?:  ColumnKey<TData>  // required for type='data'|'header', optional for action|custom
  render?:     (value: TData[keyof TData], context: CellContext<TData>) => React.ReactNode
  className?:  string
  style?:      React.CSSProperties
  colSpan?:    number
  sticky?:     'left' | 'right'

  // Injected by Body — never set manually
  _row?:        TData
  _rowIndex?:   number
  _isSelected?: boolean
  _isExpanded?: boolean
}

function Cell<TData>({
  type = 'data',
  columnKey,
  render,
  className,
  style,
  colSpan,
  sticky,
  _row,
  _rowIndex = 0,
  _isSelected = false,
  _isExpanded = false,
}: CellProps<TData>) {

  const grid = useGridContext<TData>()

  // Find column definition (if any)
  const columnDef = columnKey
    ? grid.columns.find(c => c.key === columnKey)
    : undefined

  // Extract value
  const value: TData[keyof TData] | undefined =
    _row && columnKey
      ? columnDef?.getValue
        ? columnDef.getValue(_row)
        : _row[columnKey as keyof TData]
      : undefined

  // Build context object passed to render functions
  const context: CellContext<TData> = {
    row:         _row as TData,
    rowIndex:    _rowIndex,
    rowKey:      _row ? grid.getRowKey(_row) : '',
    value:       value as TData[keyof TData],
    column:      columnDef as ColumnDef<TData>,
    isSelected:  _isSelected,
    isExpanded:  _isExpanded,
    isLoading:   grid.state.isLoading,
    grid,
  }

  // Resolve content
  let content: React.ReactNode = null
  if (render) {
    content = render(value as TData[keyof TData], context)
  } else if (columnDef?.render) {
    content = columnDef.render(value, context)
  } else if (type === 'data' && value != null) {
    content = String(value)
  } else if (type === 'skeleton') {
    content = <span data-lattice-skeleton aria-hidden="true" />
  }

  return (
    <div
      role={type === 'header' ? 'columnheader' : 'gridcell'}
      data-lattice-cell
      data-type={type}
      data-column={columnKey}
      data-sticky={sticky}
      data-span={colSpan}
      className={className}
      style={{
        ...style,
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
      }}
      aria-colindex={columnKey
        ? grid.columns.findIndex(c => c.key === columnKey) + 1
        : undefined}
      {...grid.getCellProps(columnKey as ColumnKey<TData>, _row as TData)}
    >
      {content}
    </div>
  )
}
```

---

## 7. Context System

### 7.1 Typed context — avoid the `unknown` trap

```ts
// packages/react/src/context.tsx

import { createContext, useContext } from 'react'
import type { GridInstance } from 'reactzero-lattice/core'

// We store GridInstance<unknown> in context and re-cast at the hook level.
// This avoids the impossible "GridInstance<TData>" generic in createContext.
const GridContext = createContext<GridInstance<unknown> | null>(null)

// The typed hook — cast happens here, safely
export function useGridContext<TData>(): GridInstance<TData> {
  const ctx = useContext(GridContext)
  if (!ctx) {
    throw new Error('[Lattice] useGridContext must be used inside a <Grid> component')
  }
  return ctx as GridInstance<TData>
}

// Provider export for advanced use cases
export { GridContext }
```

### 7.2 Why `<unknown>` in context is safe

The re-cast `ctx as GridInstance<TData>` is safe because:
1. The consumer always knows their `TData` type from their data source
2. The Grid's `TData` and the consuming component's `TData` are always the same
3. TypeScript infers `TData` from the `useGridContext<User>()` call

Do NOT try to make context generic with `createContext<GridInstance<TData>>()` —
it's impossible without a runtime factory and creates more problems than it solves.

---

## 8. Hooks API

### 8.1 useGrid — the headless hook

For teams that want 100% markup control with no JSX components:

```ts
// packages/react/src/hooks/useGrid.ts

import { useReducer, useMemo, useCallback } from 'react'
import { gridReducer } from './useGridReducer'
import { runPipeline, initialGridState } from 'reactzero-lattice/core'

type UseGridOptions<TData> = {
  data:      TData[]
  columns?:  ColumnDef<TData>[]
  plugins?:  LatticePlugin<TData>[]
  rowKey:    RowKey<TData>
}

export function useGrid<TData>({
  data,
  columns = [],
  plugins = [],
  rowKey,
}: UseGridOptions<TData>): GridInstance<TData> {

  const [state, dispatch] = useReducer(
    (s: GridState<TData>, a: GridAction<TData>) =>
      gridReducer(s, a, plugins),
    () => plugins.reduce(
      (acc, p) => ({ ...acc, ...p.initialState }),
      initialGridState<TData>(data),
    ),
  )

  const { sortedRows, filteredRows, paginatedRows } = useMemo(
    () => runPipeline(data, state, plugins),
    [data, state, plugins],
  )

  // ... same instance building as Grid component
  // Returns the full GridInstance<TData>
}
```

### 8.2 usePlugin — access a plugin's public API

```ts
// packages/react/src/hooks/usePlugin.ts

export function usePlugin<TPlugin extends LatticePlugin<TData>, TData = unknown>(
  pluginId: string
): ReturnType<TPlugin['init']> {
  const grid = useGridContext<TData>()
  return grid.getPlugin<TPlugin>(pluginId)
}

// Usage:
const sort = usePlugin<typeof sortPlugin>('sort')
sort.setSortBy('name', 'asc')
```

### 8.3 useGridContext — consumer access

```ts
// Use inside any component inside <Grid>
function MyCustomCell() {
  const grid = useGridContext<User>()
  // grid.state.sortState, grid.dispatch, etc.
}
```

---

## 9. Plugin System

### 9.1 Architecture principles

Plugins are **pure factory functions** — they take options and return a `LatticePlugin<TData>`.
They do NOT hold React state internally. All state lives in the grid's `useReducer`.

The plugin factory pattern:
```
sortPlugin(options) → LatticePlugin<TData>
```

The plugin receives the grid instance in `init()` and can:
1. Add state via `initialState`
2. Transform data via `processFilteredRows`, `processSortedRows`, `processPaginatedRows`
3. Handle custom actions via `reducer`
4. Expose a public API via `init` return value

### 9.2 Sort Plugin — full implementation

```ts
// packages/sort/src/plugin.ts

import type {
  LatticePlugin,
  GridState,
  GridAction,
  ColumnKey,
  SortDirection,
  SortState,
  SortFn,
} from 'reactzero-lattice/core'

type SortPluginOptions<TData> = {
  defaultSort?:    SortState<TData>
  multiSort?:      boolean
  defaultSortFns?: {
    string?: SortFn<TData, string>
    number?: SortFn<TData, number>
    date?:   SortFn<TData, Date>
  }
}

type SortPluginAPI<TData> = {
  setSortBy:     (key: ColumnKey<TData>, direction: SortDirection) => void
  toggleSort:    (key: ColumnKey<TData>) => void
  clearSort:     () => void
  getSortState:  () => SortState<TData>[]
  isSorted:      (key: ColumnKey<TData>) => SortDirection
}

export function sortPlugin<TData>(
  options: SortPluginOptions<TData> = {},
): LatticePlugin<TData> {
  const {
    defaultSort,
    multiSort = false,
    defaultSortFns = {},
  } = options

  return {
    id: 'sort',

    initialState: {
      sortState: defaultSort ? [defaultSort] : [],
    },

    init({ grid, dispatch }): SortPluginAPI<TData> {
      return {
        setSortBy: (key, direction) => {
          if (!direction) {
            dispatch({ type: 'SET_SORT', payload: [] })
            return
          }
          const newState: SortState<TData>[] = multiSort
            ? [
                ...grid.state.sortState.filter(s => s.key !== key),
                { key, direction },
              ]
            : [{ key, direction }]
          dispatch({ type: 'SET_SORT', payload: newState })
        },

        toggleSort: (key) => {
          const current = grid.state.sortState.find(s => s.key === key)
          if (!current) {
            dispatch({ type: 'SET_SORT', payload: multiSort
              ? [...grid.state.sortState, { key, direction: 'asc' }]
              : [{ key, direction: 'asc' }]
            })
          } else if (current.direction === 'asc') {
            dispatch({ type: 'SET_SORT', payload: grid.state.sortState.map(
              s => s.key === key ? { ...s, direction: 'desc' as const } : s
            )})
          } else {
            dispatch({ type: 'SET_SORT', payload:
              grid.state.sortState.filter(s => s.key !== key)
            })
          }
        },

        clearSort:    () => dispatch({ type: 'SET_SORT', payload: [] }),
        getSortState: () => grid.state.sortState,
        isSorted:     (key) => grid.state.sortState.find(s => s.key === key)?.direction ?? false,
      }
    },

    processSortedRows(rows, state): TData[] {
      if (!state.sortState.length) return rows

      return [...rows].sort((a, b) => {
        for (const { key, direction } of state.sortState) {
          const column = grid.columns.find(c => c.key === key)
          const aVal = column?.getValue ? column.getValue(a) : a[key as keyof TData]
          const bVal = column?.getValue ? column.getValue(b) : b[key as keyof TData]

          // Use column-specific sortFn first
          const sortFn = column?.sortFn

          let result = 0
          if (sortFn) {
            result = sortFn(aVal as never, bVal as never, a, b)
          } else {
            // Default sort by type
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              result = aVal - bVal
            } else if (aVal instanceof Date && bVal instanceof Date) {
              result = aVal.getTime() - bVal.getTime()
            } else {
              result = String(aVal).localeCompare(String(bVal), undefined, {
                numeric:    true,
                sensitivity: 'base',
              })
            }
          }

          if (result !== 0) {
            return direction === 'asc' ? result : -result
          }
        }
        return 0
      })
    },
  }
}
```

### 9.3 Filter Plugin

```ts
// packages/filter/src/plugin.ts

type FilterPluginOptions<TData> = {
  debounce?:      number    // ms, default 200
  globalFilter?:  boolean
  columnFilters?: boolean
}

export function filterPlugin<TData>(
  options: FilterPluginOptions<TData> = {},
): LatticePlugin<TData> {
  const { debounce: debounceMs = 200 } = options

  return {
    id: 'filter',

    init({ dispatch }) {
      // Debounced dispatch for text input performance
      let timer: ReturnType<typeof setTimeout>

      return {
        setGlobalFilter: (value: string) => {
          clearTimeout(timer)
          timer = setTimeout(() => {
            dispatch({ type: 'SET_GLOBAL_FILTER', payload: value })
          }, debounceMs)
        },

        setColumnFilter: (key: ColumnKey<TData>, value: string) => {
          clearTimeout(timer)
          timer = setTimeout(() => {
            dispatch({ type: 'SET_COLUMN_FILTER', payload: { key, value } })
          }, debounceMs)
        },

        clearFilters: () => {
          clearTimeout(timer)
          dispatch({ type: 'SET_GLOBAL_FILTER', payload: '' })
          // NOTE: clearing all column filters requires a new action type
          // 'CLEAR_ALL_FILTERS' — add to the reducer
        },
      }
    },

    processFilteredRows(rows, state): TData[] {
      let result = rows

      // Global filter
      if (state.globalFilter) {
        const term = state.globalFilter.toLowerCase()
        result = result.filter(row =>
          Object.values(row as Record<string, unknown>)
            .some(val => String(val).toLowerCase().includes(term))
        )
      }

      // Column filters
      for (const [key, value] of Object.entries(state.columnFilters)) {
        if (!value) continue
        const column = grid.columns.find(c => c.key === key)
        const filterFn = column?.filterFn

        result = result.filter(row => {
          const cellValue = column?.getValue
            ? column.getValue(row)
            : row[key as keyof TData]

          if (filterFn) {
            return filterFn(cellValue as never, value, row)
          }
          // Default: case-insensitive contains
          return String(cellValue).toLowerCase().includes(value.toLowerCase())
        })
      }

      return result
    },
  }
}
```

### 9.4 Paginate Plugin

```ts
// packages/paginate/src/plugin.ts

type PaginatePluginOptions<TData> = {
  pageSize?:       number          // default 20
  pageSizeOptions?:number[]        // [10, 20, 50, 100]
  mode?:           'client' | 'server'
  // Server mode: consumer handles filtering/sorting externally
  onPageChange?:   (page: number, pageSize: number) => void
}

export function paginatePlugin<TData>(
  options: PaginatePluginOptions<TData> = {},
): LatticePlugin<TData> {
  const {
    pageSize:        defaultPageSize = 20,
    pageSizeOptions: sizes = [10, 20, 50, 100],
    mode = 'client',
    onPageChange,
  } = options

  return {
    id: 'paginate',

    initialState: {
      currentPage: 0,
      pageSize:    defaultPageSize,
    },

    init({ grid, dispatch }) {
      return {
        goToPage: (page: number) => {
          dispatch({ type: 'SET_PAGE', payload: page })
          onPageChange?.(page, grid.state.pageSize)
        },

        goToNextPage: () => {
          const next = Math.min(grid.state.currentPage + 1, grid.totalPages - 1)
          dispatch({ type: 'SET_PAGE', payload: next })
          onPageChange?.(next, grid.state.pageSize)
        },

        goToPrevPage: () => {
          const prev = Math.max(grid.state.currentPage - 1, 0)
          dispatch({ type: 'SET_PAGE', payload: prev })
        },

        setPageSize: (size: number) => {
          dispatch({ type: 'SET_PAGE_SIZE', payload: size })
        },

        pageSizeOptions: sizes,

        get currentPage()  { return grid.state.currentPage },
        get pageSize()     { return grid.state.pageSize },
        get totalPages()   { return grid.totalPages },
        get hasNextPage()  { return grid.state.currentPage < grid.totalPages - 1 },
        get hasPrevPage()  { return grid.state.currentPage > 0 },
        get pageStart()    { return grid.state.currentPage * grid.state.pageSize + 1 },
        get pageEnd()      { return Math.min(
          (grid.state.currentPage + 1) * grid.state.pageSize,
          grid.totalFilteredRows,
        )},
      }
    },

    processPaginatedRows(rows, state): TData[] {
      if (mode === 'server') return rows  // server handles pagination

      const start = state.currentPage * state.pageSize
      const end   = start + state.pageSize
      return rows.slice(start, end)
    },
  }
}
```

### 9.5 Pre-built Pagination UI components (ship with reactzero-lattice/paginate)

```tsx
// packages/paginate/src/components/ArrowPagination.tsx
// Headless-style: no CSS shipped, uses data-* attributes for consumer styling

import { useGridContext } from 'reactzero-lattice/react'
import { usePlugin }      from 'reactzero-lattice/react'

type ArrowPaginationProps = {
  showTotal?:    boolean
  showPageSize?: boolean
  className?:    string
}

export function ArrowPagination({ showTotal, showPageSize, className }: ArrowPaginationProps) {
  const grid   = useGridContext()
  const pager  = usePlugin('paginate')

  return (
    <nav
      data-lattice-pagination
      data-type="arrow"
      className={className}
      aria-label="Table pagination"
    >
      {showTotal && (
        <span data-lattice-page-info>
          {pager.pageStart}–{pager.pageEnd} of {grid.totalFilteredRows}
        </span>
      )}

      <button
        data-lattice-page-prev
        onClick={pager.goToPrevPage}
        disabled={!pager.hasPrevPage}
        aria-label="Previous page"
      >
        ‹
      </button>

      <span data-lattice-page-current>
        {pager.currentPage + 1} / {pager.totalPages}
      </span>

      <button
        data-lattice-page-next
        onClick={pager.goToNextPage}
        disabled={!pager.hasNextPage}
        aria-label="Next page"
      >
        ›
      </button>

      {showPageSize && (
        <select
          data-lattice-page-size
          value={pager.pageSize}
          onChange={e => pager.setPageSize(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {pager.pageSizeOptions.map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      )}
    </nav>
  )
}
```

---

## 10. CSS Architecture — data-* attribute system

### 10.1 Philosophy

Lattice emits zero CSS. The `data-*` attribute system is the styling contract between
Lattice and the consumer. Every stateful change is reflected in a `data-*` attribute change.
No `className` toggling in JavaScript. No inline style injection.

This means:
- CSS-only themes are possible (just a `.css` file)
- No specificity battles with consumer CSS
- CSS DevTools show the semantic state, not an opaque class name
- `[data-selected]` is self-documenting; `--selected-row` is not

### 10.2 Complete attribute reference

```
Grid wrapper:
  [data-lattice-grid]
  [data-lattice-grid][data-loading]        ← when isLoading = true
  [data-lattice-grid][data-empty]          ← when rows.length = 0

Header row group:
  [data-lattice-header]

Header cell:
  [data-lattice-header-cell]
  [data-lattice-header-cell][data-column="KEY"]
  [data-lattice-header-cell][data-sortable]
  [data-lattice-header-cell][data-sort="asc"]
  [data-lattice-header-cell][data-sort="desc"]
  [data-lattice-header-cell][data-filterable]

Body row group:
  [data-lattice-body]

Row:
  [data-lattice-row]
  [data-lattice-row][data-row-index="N"]
  [data-lattice-row][data-selected]        ← boolean, present = selected
  [data-lattice-row][data-expanded]
  [data-lattice-row][data-loading]
  [data-lattice-row][data-row-index="0"]   ← first row targeting

Cell:
  [data-lattice-cell]
  [data-lattice-cell][data-type="data"]
  [data-lattice-cell][data-type="action"]
  [data-lattice-cell][data-type="header"]
  [data-lattice-cell][data-type="divider"]
  [data-lattice-cell][data-type="skeleton"]
  [data-lattice-cell][data-type="custom"]
  [data-lattice-cell][data-column="KEY"]
  [data-lattice-cell][data-sticky="left"]
  [data-lattice-cell][data-sticky="right"]
  [data-lattice-cell][data-span="N"]

Footer:
  [data-lattice-footer]

Pagination:
  [data-lattice-pagination]
  [data-lattice-pagination][data-type="arrow"]
  [data-lattice-pagination][data-type="numeric"]
  [data-lattice-page-prev]
  [data-lattice-page-next]
  [data-lattice-page-current]
  [data-lattice-page-size]
  [data-lattice-page-info]

Skeleton:
  [data-lattice-skeleton]

DevTools:
  [data-lattice-devtools]
  [data-lattice-devtools-panel]
```

### 10.3 Reference theme — minimal.css (ships as optional)

This ships as an opt-in starting point, not a default:

```css
/* reactzero-lattice/react/themes/minimal.css */
/* Complete reference theme — override any variable */

:root {
  --lattice-cell-padding:     0.75rem 1rem;
  --lattice-header-padding:   0.5rem 1rem;
  --lattice-row-border:       1px solid rgb(0 0 0 / 0.06);
  --lattice-row-hover-bg:     rgb(0 0 0 / 0.02);
  --lattice-selected-bg:      rgb(99 102 241 / 0.08);
  --lattice-expanded-bg:      rgb(99 102 241 / 0.04);
  --lattice-header-bg:        rgb(0 0 0 / 0.02);
  --lattice-sticky-shadow-l:  2px 0 8px rgb(0 0 0 / 0.06);
  --lattice-sticky-shadow-r: -2px 0 8px rgb(0 0 0 / 0.06);
  --lattice-skeleton-bg:      rgb(0 0 0 / 0.06);
  --lattice-skeleton-shine:   rgb(255 255 255 / 0.6);
}

[data-lattice-grid] {
  display:     grid;
  grid-template-rows: auto 1fr auto;
  container-type: inline-size;
}

[data-lattice-body] {
  display: contents;
}

[data-lattice-row] {
  display: contents;
}
/* IMPORTANT: display:contents makes the Row transparent to CSS Grid.
   The cells become direct children of the grid container.
   This means you apply grid-template-columns on [data-lattice-grid]. */

[data-lattice-cell],
[data-lattice-header-cell] {
  padding: var(--lattice-cell-padding);
  border-bottom: var(--lattice-row-border);
}

[data-lattice-header-cell] {
  padding:    var(--lattice-header-padding);
  background: var(--lattice-header-bg);
  font-weight: 500;
  white-space: nowrap;
}

[data-lattice-row]:hover [data-lattice-cell] {
  background: var(--lattice-row-hover-bg);
}

[data-lattice-row][data-selected] [data-lattice-cell] {
  background: var(--lattice-selected-bg);
}

/* Sticky cells */
[data-lattice-cell][data-sticky="left"],
[data-lattice-header-cell][data-sticky="left"] {
  position: sticky;
  left: 0;
  z-index: 1;
  box-shadow: var(--lattice-sticky-shadow-l);
}

/* Sortable header interactions */
[data-lattice-header-cell][data-sortable] {
  cursor: pointer;
  user-select: none;
}

[data-lattice-header-cell][data-sortable]:hover {
  background: rgb(0 0 0 / 0.04);
}

/* Sort indicators via CSS content — no JS, no icons */
[data-lattice-header-cell][data-sort="asc"]::after  { content: " ↑"; opacity: 0.6; }
[data-lattice-header-cell][data-sort="desc"]::after { content: " ↓"; opacity: 0.6; }

/* Skeleton animation */
[data-lattice-skeleton] {
  display: block;
  height: 1em;
  width: 80%;
  background: linear-gradient(
    90deg,
    var(--lattice-skeleton-bg) 0%,
    var(--lattice-skeleton-shine) 50%,
    var(--lattice-skeleton-bg) 100%
  );
  background-size: 200% 100%;
  animation: lattice-shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes lattice-shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

/* Pagination */
[data-lattice-pagination] {
  display:     flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

[data-lattice-page-prev]:disabled,
[data-lattice-page-next]:disabled {
  opacity: 0.4;
  cursor:  not-allowed;
}
```

### 10.4 Consumer grid layout — how to set column widths

```css
/* Consumer sets the grid column layout — Lattice never touches this */
[data-lattice-grid] {
  /* Simple equal columns */
  grid-template-columns: repeat(4, 1fr);

  /* Named columns — most powerful approach */
  grid-template-columns:
    [id]     4rem
    [name]   1fr
    [email]  1fr
    [role]   8rem
    [actions] 5rem;
}

/* Target a specific column by name */
[data-lattice-cell][data-column="amount"] {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

[data-lattice-cell][data-column="status"] {
  font-weight: 500;
}

/* Responsive — hide columns at small widths using container queries */
@container (max-width: 600px) {
  [data-lattice-cell][data-column="email"],
  [data-lattice-header-cell][data-column="email"] {
    display: none;
  }
}
```

---

## 11. Accessibility Implementation

### 11.1 The ARIA grid role model

Lattice implements the WAI-ARIA `grid` design pattern. This is the correct
pattern for interactive data tables (not `table` role, which is for static data).

```
role="grid"             ← Grid component
  role="rowgroup"       ← Grid.Header
    role="row"          ← header row
      role="columnheader" ← Cell type="header"
        aria-sort="ascending" | "descending" | "none"
  role="rowgroup"       ← Grid.Body
    role="row"          ← each Row
      aria-rowindex="N"
      aria-selected="true" | undefined
      role="gridcell"   ← Cell type="data"
        aria-colindex="N"
```

### 11.2 aria-* prop getters implementation

```ts
// In Grid component

getGridProps: () => ({
  role:            'grid',
  'aria-label':    ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-rowcount': totalRows,
  'aria-colcount': columns.length,
  'aria-multiselectable': state.selectedKeys.size > 0 ? true : undefined,
  'aria-busy':     state.isLoading || undefined,
}),

getHeaderProps: (columnKey) => {
  const sortState = state.sortState.find(s => s.key === columnKey)
  return {
    role:      'columnheader',
    scope:     'col',
    'aria-sort': sortState
      ? sortState.direction === 'asc' ? 'ascending' : 'descending'
      : grid.columns.find(c => c.key === columnKey)?.enableSort
        ? 'none'
        : undefined,
  }
},

getRowProps: (row, index) => ({
  role:            'row',
  'aria-rowindex': index + 2,          // +2: 1-based, header is row 1
  'aria-selected': isSelected(row) || undefined,
  'aria-expanded': isExpanded(row) || undefined,
  'aria-level':    undefined,          // set by expand plugin when nested
}),

getCellProps: (columnKey, row) => ({
  role:         'gridcell',
  'aria-colindex': columns.findIndex(c => c.key === columnKey) + 1,
}),
```

### 11.3 Keyboard navigation

Implement the roving `tabindex` pattern for grid cells:

```ts
// packages/react/src/hooks/useGridKeyboard.ts

export function useGridKeyboard<TData>(grid: GridInstance<TData>) {
  const [focusedCell, setFocusedCell] = useState<
    { rowIndex: number; colIndex: number } | null
  >(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) return

    const { rowIndex, colIndex } = focusedCell
    const totalCols = grid.columns.length
    const totalRows = grid.rows.length

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        setFocusedCell({ rowIndex, colIndex: Math.min(colIndex + 1, totalCols - 1) })
        break
      case 'ArrowLeft':
        e.preventDefault()
        setFocusedCell({ rowIndex, colIndex: Math.max(colIndex - 1, 0) })
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedCell({ rowIndex: Math.min(rowIndex + 1, totalRows - 1), colIndex })
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedCell({ rowIndex: Math.max(rowIndex - 1, 0), colIndex })
        break
      case 'Home':
        e.preventDefault()
        setFocusedCell(e.ctrlKey
          ? { rowIndex: 0, colIndex: 0 }
          : { rowIndex, colIndex: 0 })
        break
      case 'End':
        e.preventDefault()
        setFocusedCell(e.ctrlKey
          ? { rowIndex: totalRows - 1, colIndex: totalCols - 1 }
          : { rowIndex, colIndex: totalCols - 1 })
        break
    }
  }

  return { focusedCell, handleKeyDown }
}
```

---

## 12. Built-in Plugins — Full Spec

### 12.1 Select Plugin

```ts
// packages/select/src/plugin.ts

type SelectPluginOptions<TData> = {
  mode?:              'single' | 'multi' | 'range'
  onSelectionChange?: (selectedRows: TData[]) => void
  getCheckboxProps?:  (row: TData) => { disabled?: boolean; 'aria-label'?: string }
}

export function selectPlugin<TData>(
  options: SelectPluginOptions<TData> = {},
): LatticePlugin<TData> {
  const { mode = 'multi', onSelectionChange, getCheckboxProps } = options

  return {
    id: 'select',

    init({ grid, dispatch }) {
      const getSelected = (): TData[] =>
        grid.rows.filter(row => grid.isSelected(row))

      return {
        selectRow: (row: TData) => {
          if (mode === 'single') {
            dispatch({ type: 'CLEAR_SELECTION' })
          }
          dispatch({ type: 'TOGGLE_SELECT', payload: grid.getRowKey(row) })
          onSelectionChange?.(getSelected())
        },

        selectAll: () => {
          // Inject all row keys into selectedKeys
          const allKeys = grid.rows.map(r => grid.getRowKey(r))
          // Use a new action type or multiple TOGGLE_SELECT dispatches
          allKeys.forEach(key => dispatch({ type: 'TOGGLE_SELECT', payload: key }))
          onSelectionChange?.(grid.rows)
        },

        clearSelection: () => {
          dispatch({ type: 'CLEAR_SELECTION' })
          onSelectionChange?.([])
        },

        getSelected,

        getCheckboxProps: getCheckboxProps ?? (() => ({})),

        get selectedCount() { return grid.state.selectedKeys.size },
        get isAllSelected() { return grid.state.selectedKeys.size === grid.rows.length },
        get isIndeterminate() {
          const size = grid.state.selectedKeys.size
          return size > 0 && size < grid.rows.length
        },
      }
    },
  }
}
```

### 12.2 Expand Plugin

```ts
// packages/expand/src/plugin.ts

type ExpandPluginOptions<TData> = {
  getExpandedContent?: (row: TData, context: CellContext<TData>) => React.ReactNode
  onExpandChange?:     (expandedRows: TData[]) => void
}

export function expandPlugin<TData>(
  options: ExpandPluginOptions<TData> = {},
): LatticePlugin<TData> {
  return {
    id: 'expand',

    init({ grid, dispatch }) {
      return {
        toggleExpand: (row: TData) => {
          dispatch({ type: 'TOGGLE_EXPAND', payload: grid.getRowKey(row) })
        },

        getExpandedContent: options.getExpandedContent,

        get expandedCount() { return grid.state.expandedKeys.size },
      }
    },
  }
}
```

---

## 13. DevTools Panel

### 13.1 Architecture

The DevTools panel is a floating overlay component that subscribes to the
`GridContext` and visualizes the grid's live state. It has zero effect on
production builds when tree-shaken:

```ts
// packages/devtools/src/index.ts

// IMPORTANT: DevTools should only be imported in development.
// Usage:
//   import { LatticeDevTools } from 'reactzero-lattice/devtools'
//   Only add this component when process.env.NODE_ENV !== 'production'

// The component is ~50kb — do NOT include in production bundles.
// Recommended pattern:
if (process.env.NODE_ENV === 'development') {
  const { LatticeDevTools } = await import('reactzero-lattice/devtools')
}
```

### 13.2 Panel structure

```tsx
// packages/devtools/src/DevtoolsPanel.tsx

type DevtoolsPanelProps = {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  initialOpen?: boolean
}

export function LatticeDevTools({ position = 'bottom-right', initialOpen = false }: DevtoolsPanelProps) {
  const [open, setOpen] = useState(initialOpen)
  const [activeTab, setActiveTab] = useState<'state' | 'pipeline' | 'performance' | 'plugins'>('state')
  const grid = useGridContext()

  return (
    <div data-lattice-devtools data-position={position}>
      <button
        data-lattice-devtools-toggle
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle Lattice DevTools"
      >
        ⬡ Lattice
      </button>

      {open && (
        <div data-lattice-devtools-panel role="dialog" aria-label="Lattice DevTools">
          {/* Tab navigation */}
          <nav data-lattice-devtools-tabs>
            <button data-active={activeTab === 'state'}       onClick={() => setActiveTab('state')}>State</button>
            <button data-active={activeTab === 'pipeline'}    onClick={() => setActiveTab('pipeline')}>Pipeline</button>
            <button data-active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>Performance</button>
            <button data-active={activeTab === 'plugins'}     onClick={() => setActiveTab('plugins')}>Plugins</button>
          </nav>

          {/* Panels */}
          {activeTab === 'state'       && <StatePanel grid={grid} />}
          {activeTab === 'pipeline'    && <PipelinePanel grid={grid} />}
          {activeTab === 'performance' && <PerformancePanel grid={grid} />}
          {activeTab === 'plugins'     && <PluginPanel grid={grid} />}
        </div>
      )}
    </div>
  )
}
```

### 13.3 Panel content specs

**StatePanel** — live JSON tree of `grid.state`:
```tsx
function StatePanel({ grid }: { grid: GridInstance<unknown> }) {
  return (
    <div data-lattice-devtools-state>
      <h3>Grid State</h3>
      <pre>{JSON.stringify({
        totalRows:         grid.totalRows,
        totalFiltered:     grid.totalFilteredRows,
        currentPage:       grid.state.currentPage,
        pageSize:          grid.state.pageSize,
        sortState:         grid.state.sortState,
        globalFilter:      grid.state.globalFilter,
        columnFilters:     grid.state.columnFilters,
        selectedCount:     grid.state.selectedKeys.size,
        expandedCount:     grid.state.expandedKeys.size,
        isLoading:         grid.state.isLoading,
      }, null, 2)}</pre>
    </div>
  )
}
```

**PipelinePanel** — visualizes row counts at each stage:
```tsx
function PipelinePanel({ grid }: { grid: GridInstance<unknown> }) {
  return (
    <div data-lattice-devtools-pipeline>
      <h3>Data Pipeline</h3>
      <div data-lattice-pipeline-stage>
        <span>Raw</span>
        <span>{grid.rawRows.length} rows</span>
      </div>
      <div data-lattice-pipeline-arrow>↓ sort</div>
      <div data-lattice-pipeline-stage>
        <span>Sorted</span>
        <span>{grid.sortedRows.length} rows</span>
      </div>
      <div data-lattice-pipeline-arrow>↓ filter</div>
      <div data-lattice-pipeline-stage>
        <span>Filtered</span>
        <span>{grid.filteredRows.length} rows</span>
      </div>
      <div data-lattice-pipeline-arrow>↓ paginate</div>
      <div data-lattice-pipeline-stage data-active>
        <span>Rendered</span>
        <span>{grid.rows.length} rows</span>
      </div>
    </div>
  )
}
```

**PerformancePanel** — uses React DevTools Profiler API:
```tsx
function PerformancePanel({ grid }: { grid: GridInstance<unknown> }) {
  const [renders, setRenders] = useState<number>(0)
  const [lastRenderMs, setLastRenderMs] = useState<number>(0)

  return (
    <Profiler id="lattice-grid" onRender={(_, __, duration) => {
      setRenders(r => r + 1)
      setLastRenderMs(duration)
    }}>
      <div data-lattice-devtools-perf>
        <h3>Performance</h3>
        <p>Renders: {renders}</p>
        <p>Last render: {lastRenderMs.toFixed(2)}ms</p>
        <p>Rows rendered: {grid.rows.length}</p>
        <p>Pipeline cost estimate: {
          grid.rawRows.length > 10000 ? '⚠ large dataset — consider virtual plugin' : '✓ ok'
        }</p>
      </div>
    </Profiler>
  )
}
```

**PluginPanel** — lists active plugins and their IDs:
```tsx
function PluginPanel({ grid }: { grid: GridInstance<unknown> }) {
  const pluginIds = ['sort', 'filter', 'paginate', 'select', 'expand']
  return (
    <div data-lattice-devtools-plugins>
      <h3>Active Plugins</h3>
      {pluginIds.map(id => (
        <div key={id} data-lattice-plugin-row>
          <span data-active={grid.hasPlugin(id)}>{grid.hasPlugin(id) ? '✓' : '○'}</span>
          <span>{id}</span>
          {grid.hasPlugin(id) && (
            <button onClick={() => {
              console.log(`[Lattice:${id}]`, grid.getPlugin(id))
            }}>log</button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## 14. Interactive Playground

### 14.1 Tech stack

```
apps/playground/
├── src/
│   ├── App.tsx              # main layout
│   ├── Editor.tsx           # Monaco editor
│   ├── Preview.tsx          # live preview iframe
│   ├── examples/
│   │   ├── simple.ts        # code strings for each example
│   │   ├── with-sort.ts
│   │   ├── with-filter.ts
│   │   ├── with-pagination.ts
│   │   ├── server-side.ts
│   │   ├── card-layout.ts
│   │   └── index.ts
│   └── worker/
│       └── transform.ts     # esbuild-wasm transform worker
└── package.json
```

### 14.2 Implementation approach

Use `@monaco-editor/react` + `esbuild-wasm` (runs in browser, no server):

```tsx
// apps/playground/src/App.tsx

import MonacoEditor    from '@monaco-editor/react'
import { transform }   from 'esbuild-wasm'
import { useEffect, useState, useCallback } from 'react'

export function Playground() {
  const [code, setCode]       = useState(EXAMPLES['simple'])
  const [compiled, setCompiled] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState('simple')

  const compile = useCallback(async (source: string) => {
    try {
      const result = await transform(source, {
        loader:  'tsx',
        target:  'es2020',
        format:  'esm',
        jsx:     'automatic',
      })
      setCompiled(result.code)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => compile(code), 500)
    return () => clearTimeout(timer)
  }, [code, compile])

  return (
    <div className="playground">
      {/* Example selector */}
      <nav className="examples-nav">
        {Object.keys(EXAMPLES).map(key => (
          <button
            key={key}
            data-active={activeExample === key}
            onClick={() => {
              setActiveExample(key)
              setCode(EXAMPLES[key as keyof typeof EXAMPLES])
            }}
          >
            {key}
          </button>
        ))}
      </nav>

      {/* Editor */}
      <MonacoEditor
        language="typescript"
        value={code}
        onChange={v => setCode(v ?? '')}
        options={{
          minimap:   { enabled: false },
          fontSize:  14,
          lineNumbers: 'on',
          theme:     'vs-dark',
        }}
      />

      {/* Live preview */}
      {error
        ? <pre className="error">{error}</pre>
        : <LivePreview code={compiled} />
      }
    </div>
  )
}
```

### 14.3 Data generator for examples

```ts
// apps/playground/src/data.ts

import { faker } from '@faker-js/faker'  // dev only

type User = {
  id:        number
  name:      string
  email:     string
  role:      'Admin' | 'Editor' | 'Viewer'
  status:    'Active' | 'Inactive'
  createdAt: string
  amount:    number
}

export function generateUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => ({
    id:        i + 1,
    name:      faker.person.fullName(),
    email:     faker.internet.email(),
    role:      faker.helpers.arrayElement(['Admin', 'Editor', 'Viewer']),
    status:    faker.helpers.arrayElement(['Active', 'Inactive']),
    createdAt: faker.date.past().toISOString().split('T')[0]!,
    amount:    Number(faker.finance.amount({ min: 100, max: 10000, dec: 2 })),
  }))
}
```

---

## 15. Beyond Tables — Examples Gallery

### 15.1 What to build

The gallery lives at `/examples` on the docs site. Each example is fully
interactive and shows the source code side-by-side.

| Example | Data type | Plugins used | What it proves |
|---------|-----------|-------------|----------------|
| Simple list | User[] | none | Zero-config usage |
| Sortable table | Product[] | sort | Sort plugin basics |
| Filter + search | Contact[] | filter | Global + column filter |
| Paginated table | Order[] | sort + filter + paginate | Full pipeline |
| Row selection | User[] | select | Checkbox + bulk actions |
| Expandable rows | Category[] | expand | Nested detail row |
| Server-side | any | paginate(server) | Async data |
| Card grid | Product[] | paginate | Not a table — CSS Grid cards |
| Kanban board | Task[] | group | Columns = groups |
| File manager | File[] | sort + expand | Tree rows |
| Comparison table | Plan[] | none | Pricing page use case |
| Activity feed | Event[] | paginate(infinite) | Infinite scroll |
| Data-dense grid | StockQuote[] | sort + filter | Finance / enterprise feel |
| Mobile list | User[] | paginate | Responsive — table → cards |

### 15.2 Structure of each example

```tsx
// apps/docs/app/examples/[slug]/page.tsx

type ExampleProps = {
  params: { slug: string }
}

export default function ExamplePage({ params }: ExampleProps) {
  const example = EXAMPLES[params.slug]
  if (!example) notFound()

  return (
    <div className="example-page">
      <h1>{example.title}</h1>
      <p>{example.description}</p>

      {/* Live demo */}
      <div className="example-demo">
        <example.component />
      </div>

      {/* Source code toggle */}
      <details>
        <summary>View source</summary>
        <CodeBlock language="tsx" code={example.source} />
      </details>

      {/* Which plugins are used */}
      <div className="example-plugins">
        {example.plugins.map(p => (
          <span key={p} className="plugin-badge">{p}</span>
        ))}
      </div>
    </div>
  )
}
```

### 15.3 Card grid example — non-table use case

```tsx
// apps/docs/app/examples/card-grid/CardGridExample.tsx
// This example is the most important "beyond tables" demonstration.
// It shows Lattice driving a CSS Grid card layout — not a <table>.

type Product = {
  id:       number
  name:     string
  price:    number
  category: string
  rating:   number
  image:    string
}

const products: Product[] = [/* ... */]

export function CardGridExample() {
  return (
    <Grid
      data={products}
      rowKey="id"
      plugins={[
        filterPlugin({ globalFilter: true }),
        paginatePlugin({ pageSize: 12 }),
      ]}
      aria-label="Product catalog"
    >
      {/* Filter input — consumer renders this wherever they want */}
      <FilterInput />  {/* from reactzero-lattice/filter */}

      <Grid.Body>
        {/*
          The Row here renders nothing by default.
          The Cell type="custom" takes full control.
          CSS Grid layout applied to [data-lattice-grid].
        */}
        <Row>
          <Cell
            type="custom"
            render={(_, ctx) => (
              <article className="product-card">
                <img src={ctx.row.image} alt={ctx.row.name} />
                <h3>{ctx.row.name}</h3>
                <span className="category">{ctx.row.category}</span>
                <span className="price">${ctx.row.price}</span>
                <span className="rating">★ {ctx.row.rating}</span>
              </article>
            )}
          />
        </Row>
      </Grid.Body>

      <Grid.Footer>
        <ArrowPagination showTotal />
      </Grid.Footer>
    </Grid>
  )
}

// CSS for the card grid:
// [data-lattice-grid] {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
//   gap: 1.5rem;
// }
```

---

## 16. Docs Site — React Landing Page

### 16.1 Stack

```
apps/docs/
├── app/                        # Next.js 15 App Router
│   ├── layout.tsx
│   ├── page.tsx                # landing page — hero + feature grid
│   ├── docs/
│   │   ├── layout.tsx          # sidebar layout
│   │   ├── getting-started/
│   │   ├── api-reference/
│   │   └── plugins/
│   └── examples/
│       └── [slug]/
├── components/
│   ├── Hero.tsx
│   ├── FeatureGrid.tsx
│   ├── LiveExample.tsx         # embedded live demos
│   ├── CodeBlock.tsx           # syntax highlighted code
│   ├── Sidebar.tsx
│   └── ApiTable.tsx            # for API reference pages
├── content/                    # MDX files
│   ├── docs/
│   └── blog/
└── package.json
```

### 16.2 Landing page sections

```tsx
// apps/docs/app/page.tsx
// The landing page must be a working demo — not marketing copy.

export default function HomePage() {
  return (
    <main>
      {/* 1. Hero — tagline + playground embed */}
      <section id="hero">
        <h1>One row. Infinite configurations.</h1>
        <p>Composable grid engine for React. Zero dependencies. CSS-first. Fully accessible.</p>
        <LiveExample exampleId="simple" />
      </section>

      {/* 2. Feature comparison */}
      <section id="features">
        <FeatureGrid features={FEATURE_LIST} />
      </section>

      {/* 3. Three embedded demos — side by side */}
      <section id="demos">
        <h2>See it in action</h2>
        <DemoGrid examples={['sort-filter', 'card-grid', 'beyond-tables']} />
      </section>

      {/* 4. Install block */}
      <section id="install">
        <CodeBlock language="bash" code="npm install reactzero-lattice/react" />
      </section>

      {/* 5. Quick start — full runnable example */}
      <section id="quick-start">
        <QuickStart />
      </section>

      {/* 6. Plugin showcase */}
      <section id="plugins">
        <PluginShowcase />
      </section>
    </main>
  )
}
```

### 16.3 MDX-based documentation

```ts
// next.config.ts
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
})

export default withMDX({
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
})
```

### 16.4 Docs navigation structure

```
Getting Started
  ├── Installation
  ├── Quick Start
  ├── Core Concepts
  └── TypeScript Guide

Components
  ├── Grid
  ├── Row
  ├── Cell
  ├── Grid.Header
  ├── Grid.Body
  └── Grid.Footer

Hooks
  ├── useGrid (headless)
  ├── useGridContext
  └── usePlugin

Plugins
  ├── Sort
  ├── Filter
  ├── Pagination
  ├── Selection
  └── Expand

Styling
  ├── data-* Attributes
  ├── CSS Custom Properties
  └── Themes

Examples
  └── (links to /examples/[slug])

API Reference
  ├── GridProps
  ├── ColumnDef
  ├── CellContext
  ├── GridInstance
  └── Plugin Interface
```

---

## 17. Storybook + Chromatic

### 17.1 Storybook setup

```ts
// packages/react/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-essentials',    // controls, actions, docs
    '@storybook/addon-a11y',          // accessibility panel — mandatory for Lattice
    '@storybook/addon-interactions',  // play functions for interaction tests
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',   // generate docs page for all tagged stories
  },
}

export default config
```

### 17.2 Story structure per component

```tsx
// packages/react/src/components/Grid.stories.tsx

import type { Meta, StoryObj } from '@storybook/react'
import { Grid, Row, Cell } from './Grid'
import { sortPlugin } from 'reactzero-lattice/sort'
import { within, userEvent } from '@storybook/testing-library'
import { expect } from '@storybook/jest'

const meta: Meta<typeof Grid> = {
  title:     'Core/Grid',
  component:  Grid,
  tags:       ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'The root Grid component. Orchestrates data, plugins, and layout.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Grid>

// --- STORIES ---

export const Simple: Story = {
  render: () => (
    <Grid data={USERS} rowKey="id" aria-label="Users">
      <Grid.Header>
        <Cell type="header" columnKey="name" />
        <Cell type="header" columnKey="email" />
        <Cell type="header" columnKey="role" />
      </Grid.Header>
      <Grid.Body>
        <Row>
          <Cell type="data" columnKey="name" />
          <Cell type="data" columnKey="email" />
          <Cell type="data" columnKey="role" />
        </Row>
      </Grid.Body>
    </Grid>
  ),
}

export const WithSort: Story = {
  render: () => (
    <Grid
      data={USERS}
      rowKey="id"
      plugins={[sortPlugin()]}
      aria-label="Sortable users"
    >
      {/* ... */}
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    // Interaction test: click the Name header, verify sort
    const canvas = within(canvasElement)
    const nameHeader = canvas.getByRole('columnheader', { name: 'Name' })
    await userEvent.click(nameHeader)
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  },
}

export const Empty: Story = {
  render: () => (
    <Grid
      data={[]}
      rowKey="id"
      emptyState={<p>No users found.</p>}
      aria-label="Empty grid"
    >
      <Grid.Body>
        <Row>
          <Cell type="data" columnKey="name" />
        </Row>
      </Grid.Body>
    </Grid>
  ),
}

export const Loading: Story = {
  render: () => (
    <Grid
      data={[]}
      rowKey="id"
      loadingState={
        <Grid data={SKELETON_ROWS} rowKey="id" aria-label="Loading">
          <Grid.Body>
            <Row>
              <Cell type="skeleton" columnKey="name" />
              <Cell type="skeleton" columnKey="email" />
            </Row>
          </Grid.Body>
        </Grid>
      }
      aria-label="Loading grid"
    >
      {/* ... */}
    </Grid>
  ),
}
```

### 17.3 Story for each Cell type

```tsx
// packages/react/src/components/Cell.stories.tsx

export const DataCell: Story = { /* renders a single cell with data */ }
export const ActionCell: Story = { /* button, dropdown, etc. */ }
export const HeaderCell: Story = { /* sort indicator, label */ }
export const SkeletonCell: Story = { /* shimmer animation */ }
export const StickyCell: Story = { /* sticky left/right positioning */ }
export const CustomCell: Story = { /* full render control */ }
```

### 17.4 Plugin stories

Each plugin package ships its own stories:

```tsx
// packages/sort/src/plugin.stories.tsx

export const SortAscending: Story = { /* ... */ }
export const SortDescending: Story = { /* ... */ }
export const MultiSort: Story = { /* hold shift + click */ }
export const CustomSortFunction: Story = { /* sort by date string */ }
export const ClearSort: Story = { /* sort → clear */ }
```

### 17.5 Chromatic configuration

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for Chromatic to track changes

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - run: npm run build --workspace=packages/react

      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          workingDir: packages/react
          buildScriptName: build-storybook
          autoAcceptChanges: main   # auto-accept on main, require approval on PRs
          exitZeroOnChanges: true
```

### 17.6 Storybook build script

```json
// packages/react/package.json
{
  "scripts": {
    "storybook":       "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## 18. Testing Strategy

### 18.1 Testing layers

| Layer | Tool | What it covers |
|-------|------|---------------|
| Unit — pure logic | Vitest | engine.ts, reducers, plugin pipeline functions |
| Unit — hooks | Vitest + `@testing-library/react-hooks` | useGrid, usePlugin |
| Component | Vitest + Testing Library | Grid, Row, Cell rendering + interactions |
| Accessibility | axe-core + `@axe-core/react` | ARIA roles, keyboard nav |
| Visual regression | Chromatic (via Storybook) | All stories |
| E2E | Playwright | Full user flows (sort, filter, paginate) |

### 18.2 Unit test examples

```ts
// packages/core/src/engine.test.ts

import { describe, it, expect } from 'vitest'
import { runPipeline } from './engine'

const data = [
  { id: 1, name: 'Zara', age: 25 },
  { id: 2, name: 'Alice', age: 30 },
  { id: 3, name: 'Bob', age: 22 },
]

describe('runPipeline', () => {
  it('returns raw data when no plugins', () => {
    const result = runPipeline(data, initialGridState(data), [])
    expect(result.paginatedRows).toEqual(data)
  })

  it('sort plugin sorts ascending correctly', () => {
    const state = { ...initialGridState(data), sortState: [{ key: 'name', direction: 'asc' }] }
    const result = runPipeline(data, state, [sortPlugin()])
    expect(result.sortedRows.map(r => r.name)).toEqual(['Alice', 'Bob', 'Zara'])
  })

  it('filter plugin filters by global term', () => {
    const state = { ...initialGridState(data), globalFilter: 'ali' }
    const result = runPipeline(data, state, [filterPlugin()])
    expect(result.filteredRows).toHaveLength(1)
    expect(result.filteredRows[0]!.name).toBe('Alice')
  })

  it('pipeline order: sort then filter', () => {
    const state = {
      ...initialGridState(data),
      sortState:    [{ key: 'name', direction: 'asc' as const }],
      globalFilter: 'b',
    }
    const result = runPipeline(data, state, [sortPlugin(), filterPlugin()])
    expect(result.filteredRows).toHaveLength(1)
    expect(result.filteredRows[0]!.name).toBe('Bob')
  })

  it('paginate plugin slices correctly', () => {
    const state = { ...initialGridState(data), currentPage: 0, pageSize: 2 }
    const result = runPipeline(data, state, [paginatePlugin()])
    expect(result.paginatedRows).toHaveLength(2)
  })
})
```

### 18.3 Component test example

```tsx
// packages/react/src/components/Grid.test.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid, Row, Cell } from './Grid'
import { sortPlugin } from 'reactzero-lattice/sort'

const users = [
  { id: 1, name: 'Zara' },
  { id: 2, name: 'Alice' },
]

it('renders all rows', () => {
  render(
    <Grid data={users} rowKey="id" aria-label="Users">
      <Grid.Body>
        <Row><Cell type="data" columnKey="name" /></Row>
      </Grid.Body>
    </Grid>
  )
  expect(screen.getByText('Zara')).toBeInTheDocument()
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

it('sorts on header click', async () => {
  render(
    <Grid data={users} rowKey="id" plugins={[sortPlugin()]} aria-label="Users">
      <Grid.Header>
        <Cell type="header" columnKey="name" />
      </Grid.Header>
      <Grid.Body>
        <Row><Cell type="data" columnKey="name" /></Row>
      </Grid.Body>
    </Grid>
  )

  const header = screen.getByRole('columnheader', { name: 'Name' })
  await userEvent.click(header)

  // After ascending sort, Alice should come before Zara
  const cells = screen.getAllByRole('gridcell')
  expect(cells[0]).toHaveTextContent('Alice')
})

it('has correct ARIA attributes', () => {
  render(
    <Grid data={users} rowKey="id" aria-label="Test grid">
      <Grid.Body>
        <Row><Cell type="data" columnKey="name" /></Row>
      </Grid.Body>
    </Grid>
  )
  expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Test grid')
  expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '2')
})
```

### 18.4 Accessibility test

```ts
// packages/react/src/a11y.test.tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(
    <Grid data={users} rowKey="id" aria-label="Users">
      <Grid.Header>
        <Cell type="header" columnKey="name" />
        <Cell type="header" columnKey="email" />
      </Grid.Header>
      <Grid.Body>
        <Row>
          <Cell type="data" columnKey="name" />
          <Cell type="data" columnKey="email" />
        </Row>
      </Grid.Body>
    </Grid>
  )
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 19. Release Process

### 19.1 Changesets for versioning

Changesets handles versioning and changelogs across all npm workspaces.

```bash
# When making a change that needs a release:
npx changeset
# → prompts: which packages changed? major/minor/patch? write a summary.

# This creates a .changeset/[random-name].md file.
# Commit it with the PR.

# On merge to main (GitHub Actions):
npx changeset version    # bumps versions + updates CHANGELOG.md files
npx changeset publish    # publishes all changed packages to npm
```

### 19.2 GitHub Actions release workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write   # for npm provenance

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version:    22
          registry-url:    https://registry.npmjs.org
          cache:           npm

      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run typecheck

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
          title:   "chore: release packages"
          commit:  "chore: version packages"
        env:
          GITHUB_TOKEN:  ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true  # npm provenance for supply chain security
```

### 19.3 Pre-release / canary builds

```bash
# For testing unreleased changes:
npx changeset pre enter canary
npx changeset version
npx changeset publish --tag canary

# Users install with:
npm install reactzero-lattice/react@canary
```

### 19.4 Version strategy

- `0.x.x` — pre-stable, breaking changes allowed between minor versions
- `1.0.0` — stable, semantic versioning strictly followed
- Plugin packages follow the core package's major version
- Peer dependency on `reactzero-lattice/core` uses `^` for minor, `~` for patch

```json
// packages/sort/package.json
{
  "peerDependencies": {
    "reactzero-lattice/react": "^0.1.0",
    "reactzero-lattice/core":  "^0.1.0"
  }
}
```

---

## APPENDIX: Build Order

When building from scratch, follow this order to avoid dependency issues:

1. `packages/core` — no React, no deps
2. `packages/react` — depends on core
3. `packages/sort` — depends on react + core
4. `packages/filter` — depends on react + core
5. `packages/paginate` — depends on react + core
6. `packages/select` — depends on react + core
7. `packages/expand` — depends on react + core
8. `packages/devtools` — depends on react
9. `apps/playground` — depends on all packages
10. `apps/docs` — depends on all packages

---

## APPENDIX: Decision Log

| # | Decision | Alternative considered | Why chosen |
|---|---|---|---|
| 1 | Cell-first JSX over column config objects | Column config array | More readable, composable, JSX-native |
| 2 | `useReducer` for grid state | Zustand / Valtio | No external deps, concurrent-safe, testable |
| 3 | `data-*` attributes for styling | className merging | CSS-first, zero runtime, self-documenting |
| 4 | Plugin array ordering | Named plugin slots | Explicit pipeline order, simple mental model |
| 5 | `display: contents` on Row | Grid wrapper div | Lets CSS Grid layout flow to cells directly |
| 6 | `ColumnDef<TData>` as optional | Required config | JSX-only usage is a valid pattern |
| 7 | tsup for build | Rollup, esbuild direct | Native dual output, DTS generation, proven |
| 8 | npm workspaces not pnpm | pnpm | Lower contributor friction, standard tooling |
| 9 | Chromatic for visual tests | Percy, Playwright screenshots | Native Storybook integration, best-in-class |
| 10 | Changesets for versioning | semantic-release | Explicit per-PR changelogs, monorepo native |

---

*Engineering Spec v0.1 — March 2026*
*Build reference for reactzero-lattice/react*
