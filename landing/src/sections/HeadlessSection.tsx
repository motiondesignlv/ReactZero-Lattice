import { useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data/sampleData'
import { CodeBlock } from '../components/CodeBlock'

type Level = 0 | 1 | 2 | 3
type LayoutVariant = 'table' | 'compact' | 'cards'
type PolishVariant = 'minimal' | 'refined' | 'vibrant'

type LevelEntry = {
  value: Level
  label: string
  blurb: string
  cssAdded: string | { base: string; variants: Record<string, string> }
}

const levels: LevelEntry[] = [
  {
    value: 0,
    label: 'Naked',
    blurb: 'No CSS. Just raw markup from the headless engine.',
    cssAdded: `/* level 0 — zero styles */
/* Everything inside the stage is reset to browser defaults. */
.headless-stage[data-level='0'],
.headless-stage[data-level='0'] * {
  all: revert;
  box-sizing: border-box;
}

/* → rows stack vertically, cells are plain <div>s,
     text is Times New Roman. This is what Lattice
     actually ships: structured data, nothing else. */`,
  },
  {
    value: 1,
    label: '+ Layout',
    blurb: 'Pick a layout. Same markup, three different shapes — via CSS only.',
    cssAdded: {
      base: `/* level 1 — header weight applies to every layout variant */
.headless-stage[data-level='1'] .header-row {
  font-weight: 600;
}`,
      variants: {
        table: `/* layout · table — classic grid columns */
.headless-stage[data-level='1'][data-variant='table'] .grid-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.2fr 1fr 0.9fr;
}`,
        compact: `/* layout · compact — tighter columns, smaller type */
.headless-stage[data-level='1'][data-variant='compact'] .grid-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr 1fr 0.7fr 0.7fr;
}
.headless-stage[data-level='1'][data-variant='compact'] .cell {
  font-size: 0.8rem;
}`,
        cards: `/* layout · cards — same markup, each row becomes a card.
   The header is visually hidden (kept in the a11y tree).
   Body cells get an inline label via :nth-child — purely positional CSS,
   no DOM attributes needed. */
.headless-stage[data-level='1'][data-variant='cards'] .header-row {
  position: absolute;
  clip-path: inset(50%);
  height: 1px;
  width: 1px;
  overflow: hidden;
}
.headless-stage[data-level='1'][data-variant='cards'] .grid-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 10px;
}
.headless-stage[data-level='1'][data-variant='cards'] [data-lattice-body] .cell:nth-child(2)::before { content: 'Department: '; color: #9ca3af; font-size: 0.72rem; }
.headless-stage[data-level='1'][data-variant='cards'] [data-lattice-body] .cell:nth-child(3)::before { content: 'Role: '; color: #9ca3af; font-size: 0.72rem; }
.headless-stage[data-level='1'][data-variant='cards'] [data-lattice-body] .cell:nth-child(4)::before { content: 'Salary: '; color: #9ca3af; font-size: 0.72rem; }
.headless-stage[data-level='1'][data-variant='cards'] [data-lattice-body] .cell:nth-child(5)::before { content: 'Status: '; color: #9ca3af; font-size: 0.72rem; }`,
      },
    },
  },
  {
    value: 2,
    label: '+ Spacing',
    blurb: 'Padding + a row-level divider. Works cleanly even with multi-line cells.',
    cssAdded: `/* level 2 — spacing + dividers
   Divider lives on .grid-row (not each .cell) so mixed single-
   and multi-line cells still show a single clean bottom line. */
.headless-stage[data-level='2'] .grid-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.2fr 1fr 0.9fr;
  align-items: stretch;
  border-bottom: 1px solid #e5e7eb;
}
.headless-stage[data-level='2'] .cell,
.headless-stage[data-level='2'] [data-lattice-cell] {
  padding: 12px 16px;
  align-self: start;
}
.headless-stage[data-level='2'] .header-row {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  color: #6b7280;
  font-weight: 600;
}`,
  },
  {
    value: 3,
    label: '+ Polish',
    blurb: 'Three themes on top of the same markup. Minimal, refined, or vibrant — your call.',
    cssAdded: {
      base: `/* level 3 — base structure shared by every theme */
.headless-stage[data-level='3'] .grid-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.2fr 1fr 0.9fr;
  align-items: stretch;
  border-bottom: 1px solid #f3f4f6;
}
.headless-stage[data-level='3'] .cell,
.headless-stage[data-level='3'] [data-lattice-cell] {
  padding: 14px 16px;
  font-size: 0.875rem;
  align-self: start;
}
.headless-stage[data-level='3'] [data-lattice-row] {
  transition: background 0.15s;
}`,
      variants: {
        minimal: `/* polish · minimal — flat, monochrome, typographic */
.headless-stage[data-level='3'][data-variant='minimal'] [data-lattice-grid] {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0;
  box-shadow: none;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.headless-stage[data-level='3'][data-variant='minimal'] .header-row {
  background: transparent;
  border-bottom: 1px solid #111;
  color: #111;
  font-weight: 600;
}
.headless-stage[data-level='3'][data-variant='minimal'] .status-badge {
  background: transparent;
  padding: 0;
  color: inherit;
}
.headless-stage[data-level='3'][data-variant='minimal'] .status-badge::before {
  content: '● ';
}
.headless-stage[data-level='3'][data-variant='minimal'] .status-active::before { color: #16a34a; }
.headless-stage[data-level='3'][data-variant='minimal'] .status-inactive::before { color: #dc2626; }
.headless-stage[data-level='3'][data-variant='minimal'] .status-on-leave::before { color: #ca8a04; }`,
        refined: `/* polish · refined — soft rounded card, Inter, pill badges */
.headless-stage[data-level='3'][data-variant='refined'] [data-lattice-grid] {
  font-family: 'Inter', system-ui, sans-serif;
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.15);
}
.headless-stage[data-level='3'][data-variant='refined'] .header-row {
  background: linear-gradient(#fafafa, #f3f4f6);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: #6b7280;
  font-weight: 700;
}
.headless-stage[data-level='3'][data-variant='refined'] [data-lattice-row]:hover {
  background: #fafafa;
}
.headless-stage[data-level='3'][data-variant='refined'] .status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
}
.headless-stage[data-level='3'][data-variant='refined'] .status-active  { background: #dcfce7; color: #166534; }
.headless-stage[data-level='3'][data-variant='refined'] .status-inactive{ background: #fee2e2; color: #991b1b; }
.headless-stage[data-level='3'][data-variant='refined'] .status-on-leave{ background: #fef3c7; color: #92400e; }`,
        vibrant: `/* polish · vibrant — saturated dark card with a gradient header */
.headless-stage[data-level='3'][data-variant='vibrant'] [data-lattice-grid] {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px -20px rgba(99, 102, 241, 0.5);
  font-family: 'Inter', system-ui, sans-serif;
}
.headless-stage[data-level='3'][data-variant='vibrant'] .header-row {
  background: linear-gradient(90deg, #6366f1, #a855f7);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-size: 0.72rem;
}
.headless-stage[data-level='3'][data-variant='vibrant'] .grid-row {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}
.headless-stage[data-level='3'][data-variant='vibrant'] [data-lattice-row]:hover {
  background: rgba(99, 102, 241, 0.12);
}
.headless-stage[data-level='3'][data-variant='vibrant'] .status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
}
.headless-stage[data-level='3'][data-variant='vibrant'] .status-active  { background: #064e3b; color: #6ee7b7; }
.headless-stage[data-level='3'][data-variant='vibrant'] .status-inactive{ background: #450a0a; color: #fca5a5; }
.headless-stage[data-level='3'][data-variant='vibrant'] .status-on-leave{ background: #451a03; color: #fcd34d; }`,
      },
    },
  },
]

const layoutOptions: { value: LayoutVariant; label: string }[] = [
  { value: 'table', label: 'Table' },
  { value: 'compact', label: 'Compact' },
  { value: 'cards', label: 'Cards' },
]

const polishOptions: { value: PolishVariant; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'refined', label: 'Refined' },
  { value: 'vibrant', label: 'Vibrant' },
]

export function HeadlessSection() {
  const [level, setLevel] = useState<Level>(0)
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>('table')
  const [polishVariant, setPolishVariant] = useState<PolishVariant>('refined')

  const active = levels[level]!
  const variant: LayoutVariant | PolishVariant | null =
    level === 1 ? layoutVariant : level === 3 ? polishVariant : null

  // Cumulative CSS for the code panel — walks every level up to the current one
  // and, where a level has variants, picks the active variant's block too.
  const blocks: string[] = []
  for (let i = 0; i <= level; i++) {
    const entry = levels[i]!
    if (typeof entry.cssAdded === 'string') {
      blocks.push(entry.cssAdded)
    } else {
      blocks.push(entry.cssAdded.base)
      const key = i === 1 ? layoutVariant : polishVariant
      blocks.push(entry.cssAdded.variants[key]!)
    }
  }
  const cumulativeCss = blocks.join('\n\n')

  const showVariants = level === 1 || level === 3
  const variantOptions = level === 1 ? layoutOptions : polishOptions
  const variantLabel = level === 1 ? 'Layout' : 'Theme'

  return (
    <section className="section" id="headless">
      <div className="container">
        <div className="section-label">Headless · Zero CSS shipped</div>
        <h2 className="section-title">From raw data to designer UI — only CSS added</h2>
        <p className="section-desc">
          Lattice has no visual opinions. The engine just emits structured markup with{' '}
          <code>data-lattice-*</code> attributes; no stylesheet is bundled. Drag the slider below to see
          exactly how much CSS it takes to transform that raw output into a finished data grid. At step 0
          the grid is rendered, reset to browser defaults, and unstyled. At step 3 it looks like something
          you'd ship — pick a theme. Same React tree, same data, same plugins — only the CSS changes.
        </p>

        <div className="headless-slider">
          <div className="headless-slider-label">
            <span>CSS applied</span>
            <strong>
              Step {level} — {active.label}
            </strong>
          </div>
          <div className="headless-steps" role="tablist">
            {levels.map((l) => (
              <button
                key={l.value}
                type="button"
                role="tab"
                aria-selected={level === l.value}
                className={`headless-step ${level === l.value ? 'active' : ''} ${level > l.value ? 'done' : ''}`}
                onClick={() => setLevel(l.value)}
              >
                <span className="headless-step-dot" />
                <span className="headless-step-label">{l.label}</span>
              </button>
            ))}
          </div>
          <p className="headless-slider-hint">{active.blurb}</p>
        </div>

        {showVariants && (
          <div
            className="headless-variants"
            role="tablist"
            aria-label={level === 1 ? 'Layout variant' : 'Polish variant'}
          >
            <span className="headless-variants-label">{variantLabel}</span>
            {variantOptions.map((opt) => {
              const selected = variant === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`headless-variant ${selected ? 'active' : ''}`}
                  onClick={() =>
                    level === 1
                      ? setLayoutVariant(opt.value as LayoutVariant)
                      : setPolishVariant(opt.value as PolishVariant)
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="headless-layout">
          <div
            className="headless-stage"
            data-level={level}
            data-variant={variant ?? undefined}
          >
            <Grid data={employees.slice(0, 6)} rowKey="id" aria-label="Headless showcase grid">
              <Grid.Header>
                <div className="grid-row header-row">
                  <div className="cell">Name</div>
                  <div className="cell">Department</div>
                  <div className="cell">Role</div>
                  <div className="cell">Salary</div>
                  <div className="cell">Status</div>
                </div>
              </Grid.Header>
              <Grid.Body>
                <Row>
                  <div className="grid-row">
                    <Cell<Employee>
                      columnKey="name"
                      render={(v, ctx) => (
                        <div className="cell-stack">
                          <span className="cell-stack-primary">{String(v)}</span>
                          <span className="cell-stack-secondary">{ctx.row.email}</span>
                        </div>
                      )}
                    />
                    <Cell<Employee> columnKey="department" />
                    <Cell<Employee> columnKey="role" />
                    <Cell<Employee>
                      columnKey="salary"
                      render={(v) => `$${Number(v).toLocaleString()}`}
                    />
                    <Cell<Employee>
                      columnKey="status"
                      render={(v) => (
                        <span className={`status-badge status-${v}`}>{String(v)}</span>
                      )}
                    />
                  </div>
                </Row>
              </Grid.Body>
            </Grid>
          </div>

          <div className="headless-code">
            <div className="headless-code-head">
              <span className="headless-code-file">headless.css</span>
              <span className="headless-code-hint">
                {level === 0
                  ? 'Everything reverted to browser defaults'
                  : `${blocks.length} CSS block${blocks.length > 1 ? 's' : ''} applied`}
              </span>
            </div>
            <CodeBlock code={cumulativeCss} language="css" />
          </div>
        </div>
      </div>
    </section>
  )
}
