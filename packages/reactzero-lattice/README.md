# reactzero-lattice

A cell-first React data grid with a zero-dependency core engine and opt-in `sort`, `filter`, and `paginate` plugins — all shipped as one package and fully tree-shakable.

## Install

```bash
npm install reactzero-lattice
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick start

```tsx
import { Grid } from 'reactzero-lattice/react'
import { sortPlugin } from 'reactzero-lattice/sort'
import 'reactzero-lattice/styles/a11y.css'

export function People({ rows }) {
  return (
    <Grid data={rows} plugins={[sortPlugin()]}>
      <Grid.Header>
        <Grid.HeaderCell columnKey="name">Name</Grid.HeaderCell>
        <Grid.HeaderCell columnKey="role">Role</Grid.HeaderCell>
      </Grid.Header>
      <Grid.Body>
        <Grid.Row>
          <Grid.Cell columnKey="name" />
          <Grid.Cell columnKey="role" />
        </Grid.Row>
      </Grid.Body>
    </Grid>
  )
}
```

## Subpath imports (recommended)

Prefer subpath imports so bundlers only pull the code you use:

```ts
import { runPipeline } from 'reactzero-lattice/core/engine'
import type { ColumnDef } from 'reactzero-lattice/core/types'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { useGrid } from 'reactzero-lattice/react/hooks'
import { sortPlugin } from 'reactzero-lattice/sort'
import { filterPlugin } from 'reactzero-lattice/filter'
import { paginatePlugin } from 'reactzero-lattice/paginate'
```

A root barrel (`import { Grid, sortPlugin } from 'reactzero-lattice'`) also works — it relies on ESM + `sideEffects: false` for tree-shaking, which every modern bundler (Vite, Rollup, esbuild, Webpack 5) supports.

## Available subpaths

| Subpath | Contents |
| --- | --- |
| `reactzero-lattice` | Everything (barrel) |
| `reactzero-lattice/core` | Types + engine + utils |
| `reactzero-lattice/core/engine` | `runPipeline` |
| `reactzero-lattice/core/types` | All grid types |
| `reactzero-lattice/core/utils` | `initialGridState` |
| `reactzero-lattice/react` | All React components + hooks |
| `reactzero-lattice/react/components` | Grid, Row, Cell, Header, HeaderCell, Body, Footer, Detail, LiveRegion |
| `reactzero-lattice/react/hooks` | `useGrid`, `useLiveAnnouncements`, etc. |
| `reactzero-lattice/react/utils` | `buildGridTemplate` |
| `reactzero-lattice/sort` | `sortPlugin` |
| `reactzero-lattice/filter` | `filterPlugin` |
| `reactzero-lattice/paginate` | `paginatePlugin` |
| `reactzero-lattice/styles/a11y.css` | Opt-in accessibility stylesheet |

## License

MIT © [Luis Vargas](https://themotiondesign.com)
