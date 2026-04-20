# reactzero-lattice

[![npm version](https://img.shields.io/npm/v/reactzero-lattice)](https://www.npmjs.com/package/reactzero-lattice)
[![bundle size](https://img.shields.io/bundlephobia/minzip/reactzero-lattice)](https://bundlephobia.com/package/reactzero-lattice)
[![license](https://img.shields.io/npm/l/reactzero-lattice)](https://github.com/motiondesignlv/ReactZero-Lattice/blob/main/LICENSE)
[![CI](https://github.com/motiondesignlv/ReactZero-Lattice/actions/workflows/ci.yml/badge.svg)](https://github.com/motiondesignlv/ReactZero-Lattice/actions/workflows/ci.yml)

![Lattice — cell-first data grid for React](./lattice.jpg)

Zero-dependency, cell-first data grid engine for React. Compose your table the way you write JSX, not the way the library wants you to configure columns.

Part of the **React Zero** family — a set of small, opinionated React libraries with zero runtime dependencies: [@reactzero/flow](https://github.com/motiondesignlv/ReactZero-flow), [@reactzero/datepicker](https://github.com/motiondesignlv/ReactZero-DatePicker), and now **lattice**.

## Why reactzero-lattice?

- **Cell-first, not column-first** — you declare one `<Row>` template with typed `<Cell>` children, and the engine loops it over your data. No column config objects, no `cell: ({ row }) => ...` render callbacks.
- **Zero runtime dependencies** — core engine is pure TypeScript; React is the only peer dep (18+).
- **Plugin pipeline you can see** — sort, filter, and paginate are opt-in subpaths. The pipeline stages (`sort → filter → paginate`) are explicit and composable.
- **Ships no CSS** — styling is driven entirely by `data-*` attributes. Bring your own styles, no `className` merging, no runtime style injection.
- **Tree-shakeable by design** — ESM-first, `"sideEffects": false`, per-feature subpath exports. One npm install, pay only for what you import.
- **Headless + JSX** — use the `useGrid` hook for full control, or drop in `<Grid>` / `<Row>` / `<Cell>` and get the same behavior.

**How it compares:**

|  | Lattice | TanStack Table | AG Grid | Material / MUI DataGrid |
|--|---------|----------------|---------|-------------------------|
| Cell-first JSX API | Yes | No | No | No |
| Zero runtime deps | Yes | Yes | No | No |
| Plugins as tree-shakable subpaths | Yes | No | No | No |
| Ships no CSS | Yes | Yes | No | No |
| Headless hook API | Yes | Yes | No | Partial |
| Under 10 kB (core) | Yes | Yes | No | No |

## Design Philosophy

1. **Cell-first over column-first** — a table is a shape, not a config. JSX already expresses shape.
2. **Composition over configuration** — plugins are an array. Order is behavior. No hidden resolution order.
3. **The pipeline is visible** — every stage (`sort → filter → paginate`) is a named function on a plugin. No magic.
4. **Ship nothing you don't need** — CSS, virtualization, editing, row selection are all opt-in packages.
5. **Types are the docs** — every public API is strictly typed. `ColumnKey<TData>` narrows to real keys of your data.

## Features

- **Cell-first JSX API** — declare rows and cells as components, not config objects
- **Headless hook API** — `useGrid(...)` returns a fully-typed `GridInstance<TData>` for custom UIs
- **Plugin pipeline** — `sort → filter → paginate`, each stage opt-in via its own package
- **Concurrent-safe state** — all state goes through `useReducer`, no external store
- **CSS Grid ready** — `Row` uses `display: contents` so CSS Grid / Flexbox flow through
- **Row context, not cloneElement** — cells read their row via React Context, so they work at any nesting depth
- **`data-*` driven styling** — no className merging, no runtime CSS
- **Tree-shakeable** — `sideEffects: false` + ESM + per-feature subpath exports
- **Type-safe** — generic over `TData`, strict TypeScript, no `any` in the public API

## Package and subpaths

Everything ships in a single tree-shakable package: `reactzero-lattice`. Consumers pull the pieces they need via subpath imports — modern bundlers (Vite, esbuild, Rollup, Webpack 5) drop unused code automatically.

| Subpath | Purpose | Size (gzip, approx) |
|---------|---------|---------------------|
| `reactzero-lattice/core` | Pipeline engine, types, utilities. Zero React. | ~2 kB |
| `reactzero-lattice/react` | React bindings: `Grid`, `Row`, `Cell`, `useGrid` | ~4 kB |
| `reactzero-lattice/sort` | Single + multi-column sort plugin | ~1 kB |
| `reactzero-lattice/filter` | Global + per-column filter plugin (debounced) | ~1 kB |
| `reactzero-lattice/paginate` | Client-side pagination plugin | ~1 kB |
| `reactzero-lattice/styles/a11y.css` | Opt-in accessibility baseline stylesheet | — |

## Quick Start

```bash
npm install reactzero-lattice
```

```tsx
import { Grid, Row, Cell, Header, Body } from "reactzero-lattice/react";

type User = { id: string; name: string; email: string; role: string };

const data: User[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", role: "Admin" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", role: "Editor" },
];

export function Users() {
  return (
    <Grid data={data} rowKey="id">
      <Header>
        <Cell>Name</Cell>
        <Cell>Email</Cell>
        <Cell>Role</Cell>
      </Header>

      <Body>
        <Row>
          <Cell columnKey="name" />
          <Cell columnKey="email" />
          <Cell columnKey="role" />
        </Row>
      </Body>
    </Grid>
  );
}
```

You declare **one** `<Row>`. The engine renders it for each item in `data`. Cells read their value from the row via context, so they work at any nesting depth — even inside wrapper `<div>`s.

## Core Concepts

### The pipeline

Every render, your data flows through three stages:

```
data  →  sort  →  filter  →  paginate  →  paginatedRows
```

Each stage is implemented by zero or more plugins. Without any plugins, the pipeline is a passthrough and `paginatedRows === data`.

### Plugins are functions that return descriptors

A plugin is an object with an `id`, an `initialState`, an `init()` that returns its public API, and one or more pipeline hooks (`processSortedRows`, `processFilteredRows`, `processPaginatedRows`). See the [sort plugin](packages/sort/src/index.ts) for a ~100-line reference implementation.

### Cells read from row context

`<Cell columnKey="name" />` reads its row from `RowContext`. That means cells can be nested inside wrapper elements, conditional branches, or layout components — they always find their row.

> **Do not** use `React.cloneElement` to inject row props. Wrapper divs intercept the clone and silently drop the data. Always use the provided `Row` / `Body` — it wires `RowContext` automatically.

## Using Plugins

Plugins are an array. Order is the pipeline order.

```tsx
import { useGrid, Grid, Row, Cell, Header, Body } from "reactzero-lattice/react";
import { sortPlugin } from "reactzero-lattice/sort";
import { filterPlugin } from "reactzero-lattice/filter";
import { paginatePlugin } from "reactzero-lattice/paginate";

export function Users({ data }: { data: User[] }) {
  const grid = useGrid({
    data,
    rowKey: "id",
    plugins: [
      sortPlugin<User>({ multiSort: true }),
      filterPlugin<User>({ debounce: 200 }),
      paginatePlugin<User>({ pageSize: 25 }),
    ],
  });

  return (
    <Grid instance={grid}>
      <Header>
        <Cell onClick={() => grid.plugin("sort").toggleSort("name")}>Name</Cell>
        <Cell>Email</Cell>
        <Cell>Role</Cell>
      </Header>

      <Body>
        <Row>
          <Cell columnKey="name" />
          <Cell columnKey="email" />
          <Cell columnKey="role" />
        </Row>
      </Body>
    </Grid>
  );
}
```

### Plugin APIs

Each plugin returns a typed API via `grid.plugin(id)`:

| Plugin | API |
|--------|-----|
| `sortPlugin` | `setSortBy`, `toggleSort`, `clearSort`, `getSortState`, `isSorted` |
| `filterPlugin` | `setGlobalFilter`, `setColumnFilter`, `clearFilters` |
| `paginatePlugin` | `goToPage`, `goToNextPage`, `goToPrevPage`, `setPageSize`, `currentPage`, `totalPages`, `hasNextPage`, `hasPrevPage` |

### Writing your own plugin

```ts
import type { LatticePlugin } from "reactzero-lattice/core/types";

export function highlightPlugin<TData>(): LatticePlugin<TData, { flash: (id: string) => void }> {
  return {
    id: "highlight",
    initialState: { flashed: null as string | null },
    init({ dispatch }) {
      return {
        flash: (id) => dispatch({ type: "SET_FLASH", payload: id }),
      };
    },
    processPaginatedRows: (rows) => rows, // passthrough if you only need state + API
  };
}
```

## Tree Shaking

Lattice is designed so the dead-code eliminator in every modern bundler (esbuild, Rollup, Webpack 5, Vite) can drop every byte you don't use. Here are the rules:

### 1. Import only the subpaths you need

The whole library ships in one package, so there's a single install:

```bash
npm install reactzero-lattice
```

Then pull only the pieces you use via subpath imports — everything else is dropped at bundle time:

```tsx
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { sortPlugin } from 'reactzero-lattice/sort'       // include only if you sort
import { filterPlugin } from 'reactzero-lattice/filter'   // include only if you filter
import { paginatePlugin } from 'reactzero-lattice/paginate' // include only if you paginate
```

### 2. Use named imports — never `import *`

```tsx
// Good — bundler drops what you don't reference
import { Grid, Row, Cell } from "reactzero-lattice/react";

// Bad — forces the entire barrel into the graph
import * as Lattice from "reactzero-lattice/react";
```

### 3. Import from subpath exports when you only need a slice

Both `reactzero-lattice/core` and `reactzero-lattice/react` expose subpath exports so you can skip the barrel entirely when it helps:

```ts
// Only the pipeline engine, no React
import { runPipeline } from "reactzero-lattice/core/engine";

// Only types — zero runtime cost
import type { LatticePlugin, ColumnKey } from "reactzero-lattice/core/types";

// Only hooks, no components
import { useGrid } from "reactzero-lattice/react/hooks";

// Only components, no hooks
import { Grid, Row, Cell } from "reactzero-lattice/react/components";
```

### 4. Every package declares `"sideEffects": false`

This tells the bundler it is safe to drop any import whose result is unused. You don't need to configure anything in your app — this is set at the package level.

### 5. No CSS side effects to worry about

Lattice ships zero CSS. There is no `import "reactzero-lattice/react/style.css"` that would silently defeat tree-shaking by pulling in a side-effectful module. Your styles are yours.

### What a minimal bundle looks like

A page that uses only the base grid — no sort, no filter, no paginate — pulls in roughly:

| What you import | Approx gzip |
|-----------------|-------------|
| `reactzero-lattice/core` (engine + types) | ~2 kB |
| `reactzero-lattice/react` (Grid, Row, Cell, Body, Header) | ~4 kB |
| **Total** | **~6 kB** |

Adding a plugin is strictly additive — the base does not grow.

## Headless API

Prefer full control? Skip the components and drive the UI yourself.

```tsx
import { useGrid } from "reactzero-lattice/react";
import { sortPlugin } from "reactzero-lattice/sort";

function HeadlessTable({ data }: { data: User[] }) {
  const grid = useGrid({
    data,
    rowKey: "id",
    plugins: [sortPlugin<User>()],
  });

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => grid.plugin("sort").toggleSort("name")}>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {grid.paginatedRows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`useGrid` returns a `GridInstance<TData>` with `state`, `dispatch`, `sortedRows`, `filteredRows`, `paginatedRows`, and `plugin(id)` for any registered plugin.

## Styling

Lattice attaches `data-*` attributes to every structural element so you can write plain CSS without runtime className merging:

```css
[data-lattice-row][data-sorted="true"] { background: var(--accent-50); }
[data-lattice-cell][data-column="role"] { font-variant: small-caps; }
[data-lattice-cell][data-sorted-direction="asc"] { --indicator: "▲"; }
```

No theme provider, no `styled()` factory, no CSS-in-JS runtime. Ship your own CSS or use Tailwind's `data-*:` variants.

## TypeScript

Everything is generic over your row type:

```ts
type User = { id: string; name: string; email: string };

const grid = useGrid<User>({
  data: users,
  rowKey: "id",                 // autocompletes to "id" | "name" | "email"
  plugins: [sortPlugin<User>()],
});

grid.plugin("sort").toggleSort("name");  // "name" is type-checked
grid.plugin("sort").toggleSort("foo");   // type error
```

Requires TypeScript 5.0+ (6.0 recommended).

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome  | 90+ |
| Firefox | 90+ |
| Safari  | 14+ |
| Edge    | 90+ |

React 18+ required.

## Repository Layout

```
lattice/
├── packages/
│   ├── core/         # reactzero-lattice/core        — engine, types, utils
│   ├── react/        # reactzero-lattice/react       — Grid, Row, Cell, useGrid
│   ├── sort/         # reactzero-lattice/sort        — sort plugin
│   ├── filter/       # reactzero-lattice/filter      — filter plugin
│   └── paginate/     # reactzero-lattice/paginate    — paginate plugin
├── apps/
│   └── playground/   # Vite + React dev playground
└── landing/          # Docs site
```

## Development

```bash
npm install --legacy-peer-deps   # @typescript-eslint v8 does not yet support TS 6
npm run build                    # build all packages
npm run test                     # run vitest across workspaces
npm run typecheck                # project-wide typecheck
npm run landing                  # serve docs site locally
```

## Contributing

Contributions are welcome. Please open an issue first to discuss non-trivial changes. Every PR should include a changeset (`npm run changeset`) describing what changed and at what semver level.

## Author

Built and maintained by [@motiondesignlv](https://github.com/motiondesignlv) as part of the **React Zero** family.

## License

[MIT](./LICENSE)
