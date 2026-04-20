import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin, useLiveRegion } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const features = [
  {
    icon: '◈',
    title: 'ARIA correctness by default',
    desc: 'Every grid renders with role=grid, row/cell roles, aria-rowcount/colcount (filtered, not raw), aria-rowindex, aria-colindex, aria-selected, aria-expanded, and aria-busy — automatically.',
  },
  {
    icon: '⌨',
    title: 'Full keyboard navigation',
    desc: 'Roving tabindex. Arrow keys move between cells. Home / End jump within a row, Ctrl+Home / Ctrl+End jump to the grid corners, PageUp / PageDown step by page size. F2 enters cell interaction mode. Default-on — no wiring required.',
  },
  {
    icon: '✦',
    title: 'Live announcements',
    desc: 'Sort, filter, and pagination changes are debounced and announced through a polite live region. Plugins expose getSortStatusMessage / getFilterStatusMessage / getPageStatusMessage — the Grid pipes them straight to assistive tech.',
  },
  {
    icon: '◎',
    title: 'Focus never lost',
    desc: 'Focus is tracked by rowKey + columnKey, so filtering, sorting, or pagination can remount cells without losing the user’s place. Sticky headers and pinned columns pair with scroll-padding so focused rows never hide behind them (WCAG 2.2 SC 2.4.11).',
  },
  {
    icon: '◉',
    title: '24px target sizes',
    desc: 'Opt-in reactzero-lattice/styles/a11y.css ships minimum 24×24 CSS-pixel touch targets on sort toggles, filter clears, expand buttons, and page controls. Visible :focus-visible rings on every cell and control.',
  },
  {
    icon: '✓',
    title: 'WCAG 2.2 alignment',
    desc: 'Meets SC 1.3.1, 1.4.11, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 2.5.8, 3.3.2, 4.1.2, 4.1.3. Follows the WAI-ARIA APG data-grid pattern. Honors prefers-reduced-motion.',
  },
]

const complianceCriteria: { sc: string; name: string; how: string }[] = [
  { sc: '1.3.1', name: 'Info and Relationships', how: 'role=grid, rowgroup, row, columnheader, gridcell with correct aria-rowindex / aria-colindex' },
  { sc: '1.4.11', name: 'Non-text Contrast', how: 'Focus rings and sticky-corner shadows respect --lattice-focus-ring contrast tokens' },
  { sc: '2.1.1', name: 'Keyboard', how: 'All grid operations reachable via Tab → Arrow keys → Enter / Space / F2 / Escape' },
  { sc: '2.1.2', name: 'No Keyboard Trap', how: 'Escape always exits cell interaction mode; Tab moves out of the grid' },
  { sc: '2.4.3', name: 'Focus Order', how: 'Roving tabindex presents a single logical stop, restored after filter / sort / paginate' },
  { sc: '2.4.7', name: 'Focus Visible', how: 'Dedicated :focus-visible rules on every [role=gridcell] / [role=columnheader]' },
  { sc: '2.4.11', name: 'Focus Not Obscured (Minimum)', how: 'Scroll region emits scroll-padding-top / -left matching sticky offsets' },
  { sc: '2.5.8', name: 'Target Size (Minimum)', how: '24×24px minimums on all plugin-emitted controls' },
  { sc: '3.3.2', name: 'Labels or Instructions', how: 'getFilterInputProps enforces aria-label; pagination buttons get descriptive aria-labels' },
  { sc: '4.1.2', name: 'Name, Role, Value', how: 'Grid requires aria-label or aria-labelledby (dev warning); dynamic state exposed via aria-sort / aria-current / aria-selected' },
  { sc: '4.1.3', name: 'Status Messages', how: 'Built-in polite + assertive live regions, debounced to avoid spamming screen readers' },
]

const code = `import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { usePlugin } from 'reactzero-lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from 'reactzero-lattice/sort'
import { filterPlugin, type FilterPluginAPI } from 'reactzero-lattice/filter'
import { paginatePlugin, type PaginatePluginAPI } from 'reactzero-lattice/paginate'
import 'reactzero-lattice/styles/a11y.css' // opt-in: target sizes + focus rings

const plugins = [
  sortPlugin<Employee>({ multiSort: true }),
  filterPlugin<Employee>({ debounce: 150 }),
  paginatePlugin<Employee>({ pageSize: 5 }),
]

function Toolbar() {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const paginate = usePlugin<PaginatePluginAPI>('paginate')
  return (
    <div className="a11y-toolbar">
      <input {...filter.getGlobalFilterInputProps('Search employees')} />
      <button {...filter.getClearFilterProps()}>Clear</button>
      <nav {...paginate.getPaginationProps()}>
        <button {...paginate.getPrevButtonProps()}>Previous</button>
        <button {...paginate.getNextButtonProps()}>Next</button>
      </nav>
    </div>
  )
}

<Grid
  data={employees}
  rowKey="id"
  plugins={plugins}
  columns={columns}
  aria-label="Accessible employee directory"
>
  <Toolbar />
  <Grid.Header>
    <div className="grid-row grid-cols-4 header-row">
      <Grid.HeaderCell columnKey="name" label="Name" sortable />
      <Grid.HeaderCell columnKey="department" label="Department" sortable />
      <Grid.HeaderCell columnKey="role" label="Role" sortable />
      <Grid.HeaderCell columnKey="salary" label="Salary" sortable />
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-4">
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="role" />
        <Cell columnKey="salary" render={(v) => \`$\${Number(v).toLocaleString()}\`} />
      </div>
    </Row>
  </Grid.Body>
</Grid>`

const columns = [
  { key: 'name' as const, header: 'Name', enableSort: true },
  { key: 'department' as const, header: 'Department', enableSort: true },
  { key: 'role' as const, header: 'Role', enableSort: true },
  { key: 'salary' as const, header: 'Salary', enableSort: true },
]

function A11yToolbar({ onAnnounce }: { onAnnounce: (msg: string) => void }) {
  const filter = usePlugin<FilterPluginAPI<Employee>>('filter')
  const paginate = usePlugin<PaginatePluginAPI>('paginate')
  const { announce: builtIn } = useLiveRegion()

  const globalInput = filter.getGlobalFilterInputProps('Search employees')
  const clearBtn = filter.getClearFilterProps('Clear all filters')
  const paginationProps = paginate.getPaginationProps('Pagination')
  const prevBtn = paginate.getPrevButtonProps()
  const nextBtn = paginate.getNextButtonProps()

  const announce = (msg: string) => {
    builtIn(msg)
    onAnnounce(msg)
  }

  return (
    <div className="a11y-toolbar">
      <input
        {...globalInput}
        className="a11y-filter-input"
        placeholder="Search employees…"
        onChange={(e) => {
          globalInput.onChange(e)
          announce(filter.getFilterStatusMessage())
        }}
      />
      <button
        {...clearBtn}
        className="a11y-btn"
        onClick={() => {
          clearBtn.onClick()
          announce('Filters cleared')
        }}
      >
        Clear
      </button>
      <nav {...paginationProps} className="a11y-pagination">
        <button
          {...prevBtn}
          className="a11y-btn"
          disabled={!paginate.hasPrevPage}
          onClick={() => {
            prevBtn.onClick()
            announce(paginate.getPageStatusMessage())
          }}
        >
          ◀ Prev
        </button>
        <span className="a11y-page-status" aria-hidden="true">
          {paginate.getPageStatusMessage()}
        </span>
        <button
          {...nextBtn}
          className="a11y-btn"
          disabled={!paginate.hasNextPage}
          onClick={() => {
            nextBtn.onClick()
            announce(paginate.getPageStatusMessage())
          }}
        >
          Next ▶
        </button>
      </nav>
    </div>
  )
}

function SortObserver({ onAnnounce }: { onAnnounce: (msg: string) => void }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const state = sort.getSortState()
  const lastKey = useRef('')
  useEffect(() => {
    const key = state.map(s => `${s.key}:${s.direction}`).join(',')
    if (key !== lastKey.current) {
      lastKey.current = key
      if (key) onAnnounce(sort.getSortStatusMessage())
    }
  }, [state, sort, onAnnounce])
  return null
}

export function AccessibilitySection() {
  const plugins = useMemo(
    () => [
      sortPlugin<Employee>({ multiSort: false }),
      filterPlugin<Employee>({ debounce: 150 }),
      paginatePlugin<Employee>({ pageSize: 5 }),
    ],
    []
  )

  const [announcements, setAnnouncements] = useState<string[]>([])

  const record = (msg: string) => {
    setAnnouncements((prev) => {
      const next = [msg, ...prev]
      return next.slice(0, 5)
    })
  }

  return (
    <section className="section" id="accessibility">
      <div className="container">
        <div className="section-label">Accessibility · WCAG 2.2 · WAI-ARIA APG</div>
        <h2 className="section-title">Built for every keyboard, every screen reader, every device</h2>
        <p className="section-desc">
          Accessibility is a first-class Lattice feature, not a retrofit. Every grid you render gets correct
          ARIA semantics, full keyboard navigation, live-region announcements, and 24px touch targets out of
          the box. The library follows the WAI-ARIA Authoring Practices Guide data-grid pattern and satisfies
          the WCAG 2.2 success criteria that apply to interactive tabular interfaces.
        </p>

        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        <ExampleCard
          title="Accessible by default"
          description="Tab into the grid, then navigate with arrow keys. Sort with Enter or Space on a column header. Filter with the search box. Every state change is announced in the live-region echo panel."
          code={code}
        >
          <div className="a11y-demo">
            <div className="a11y-hints" aria-hidden="true">
              <strong>Try:</strong>
              <span className="kbd">Tab</span> into the grid,
              <span className="kbd">↑ ↓ ← →</span> to navigate,
              <span className="kbd">Enter</span> on a header to sort,
              <span className="kbd">Home</span>/<span className="kbd">End</span> within a row,
              <span className="kbd">PageUp</span>/<span className="kbd">PageDown</span> by page.
            </div>

            <div className="table-scroll">
              <Grid
                data={employees}
                rowKey="id"
                plugins={plugins}
                columns={columns}
                aria-label="Accessible employee directory"
              >
                <SortObserver onAnnounce={record} />
                <A11yToolbar onAnnounce={record} />
                <Grid.Header>
                  <div className="grid-row grid-cols-4 header-row">
                    <Grid.HeaderCell columnKey="name" label="Name" sortable />
                    <Grid.HeaderCell columnKey="department" label="Department" sortable />
                    <Grid.HeaderCell columnKey="role" label="Role" sortable />
                    <Grid.HeaderCell columnKey="salary" label="Salary" sortable />
                  </div>
                </Grid.Header>
                <Grid.Body>
                  <Row>
                    <div className="grid-row grid-cols-4">
                      <Cell columnKey="name" />
                      <Cell columnKey="department" />
                      <Cell columnKey="role" />
                      <Cell columnKey="salary" render={(v) => `$${Number(v).toLocaleString()}`} />
                    </div>
                  </Row>
                </Grid.Body>
              </Grid>
            </div>

            <div className="a11y-echo" aria-hidden="true">
              <div className="a11y-echo-header">
                <span className="a11y-echo-dot" />
                Live-region echo <span className="a11y-echo-sub">(what a screen reader hears)</span>
              </div>
              <ul className="a11y-echo-list">
                {announcements.length === 0 && (
                  <li className="a11y-echo-empty">Interact with the grid to see live announcements…</li>
                )}
                {announcements.map((m, i) => (
                  <li key={`${m}-${i}`} className="a11y-echo-item">{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </ExampleCard>

        <h3 className="a11y-checklist-title">WCAG 2.2 compliance checklist</h3>
        <div className="a11y-checklist" role="list">
          {complianceCriteria.map((c) => (
            <div className="a11y-checklist-item" role="listitem" key={c.sc}>
              <div className="a11y-checklist-badge">SC {c.sc}</div>
              <div className="a11y-checklist-body">
                <div className="a11y-checklist-name">{c.name}</div>
                <div className="a11y-checklist-how">{c.how}</div>
              </div>
              <div className="a11y-checklist-status" aria-label="Met">✓</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
