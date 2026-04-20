import React, { useRef, useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data/sampleData'

type Mode = 'table' | 'cards' | 'carousel'

const modes: { key: Mode; label: string }[] = [
  { key: 'table', label: 'Table' },
  { key: 'cards', label: 'Card grid' },
  { key: 'carousel', label: 'Carousel' },
]

type Variant = { key: string; label: string; blurb: string }

const variantsPerMode: Record<Mode, Variant[]> = {
  table: [
    { key: 'clean', label: 'Clean', blurb: 'Whitespace, quiet dividers.' },
    { key: 'striped', label: 'Striped', blurb: 'Zebra rows, strong header.' },
    { key: 'bordered', label: 'Bordered', blurb: 'Full cell grid, Excel-style.' },
  ],
  cards: [
    { key: 'stacked', label: 'Stacked', blurb: 'Hero name centered, label-value pairs stacked below.' },
    { key: 'split', label: 'Split', blurb: 'Two-column grid inside each card.' },
    { key: 'feature', label: 'Feature', blurb: 'Asymmetric layout — salary hero on the right, metadata on the left.' },
  ],
  carousel: [
    { key: 'gradient', label: 'Gradient', blurb: 'Stacked vertical content on an accent wash.' },
    { key: 'hero', label: 'Hero', blurb: 'Huge name banner with an accent underline and a metadata grid.' },
    { key: 'minimal', label: 'Minimal', blurb: 'Tight rows with a left accent bar and inline label + value.' },
  ],
}

function ModeIcon({ mode }: { mode: Mode }) {
  const stroke = { stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (mode === 'table') {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" {...stroke}>
        <rect x="2" y="3" width="12" height="10" rx="1" />
        <line x1="2" y1="7" x2="14" y2="7" />
        <line x1="2" y1="10" x2="14" y2="10" />
      </svg>
    )
  }
  if (mode === 'cards') {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" {...stroke}>
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...stroke}>
      <rect x="4" y="3" width="8" height="10" rx="1" />
      <line x1="1" y1="5" x2="1" y2="11" />
      <line x1="15" y1="5" x2="15" y2="11" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,3 5,8 10,13" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,3 11,8 6,13" />
    </svg>
  )
}

function LabeledCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="cell-label">{label}</span>
      <span className="cell-value">{children}</span>
    </>
  )
}

export function ViewsSection() {
  const [mode, setMode] = useState<Mode>('table')
  const [variant, setVariant] = useState<Record<Mode, string>>({
    table: 'clean',
    cards: 'stacked',
    carousel: 'gradient',
  })
  const [accent, setAccent] = useState('#6366f1')
  const stageRef = useRef<HTMLDivElement>(null)
  const activeVariant = variant[mode]
  const activeVariantMeta = variantsPerMode[mode].find((v) => v.key === activeVariant)!

  // View Transitions API — the whole mode swap crossfades in one frame.
  // CSS owns the actual animation (see ::view-transition-* rules in global.css).
  const changeMode = (next: Mode) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown
    }
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => setMode(next))
    } else {
      setMode(next)
    }
  }

  const scrollCarousel = (dir: -1 | 1) => {
    const body = stageRef.current?.querySelector<HTMLElement>('[data-lattice-body]')
    if (!body) return
    const card = body.querySelector<HTMLElement>('[data-lattice-row]')
    const step = (card?.offsetWidth ?? 280) + 16
    body.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section className="section" id="views">
      <div className="container">
        <div className="section-label">Live CSS · Views · Navigation</div>
        <h2 className="section-title">One grid, three layouts, infinite styles</h2>
        <p className="section-desc">
          The component tree below is a single <code>&lt;Grid&gt;</code> that renders the same rows and
          cells every time. Flipping the view mode only swaps a <code>data-mode</code> attribute on the
          wrapper; CSS does the rest — container queries reflow the card grid, <code>scroll-snap</code> powers
          the carousel, <code>color-mix()</code> derives the palette from your picked accent, and
          <code>:has()</code> + <code>@property</code> keep hover states in sync. Mode swaps animate through
          the View Transitions API when the browser supports it.
        </p>

        <div className="views-controls">
          <div className="views-mode-toggle" role="tablist">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={mode === m.key}
                className={`views-mode ${mode === m.key ? 'active' : ''}`}
                onClick={() => changeMode(m.key)}
              >
                <ModeIcon mode={m.key} />
                {m.label}
              </button>
            ))}
          </div>

          <label className="views-accent">
            <span>Accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Accent color"
            />
            <code>{accent}</code>
          </label>
        </div>

        <div className="views-variants" role="tablist" aria-label={`${mode} style variants`}>
          <span className="views-variants-label">{mode} style</span>
          {variantsPerMode[mode].map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={activeVariant === v.key}
              className={`views-variant vv-${mode}-${v.key} ${activeVariant === v.key ? 'active' : ''}`}
              onClick={() =>
                setVariant((prev) => ({ ...prev, [mode]: v.key }))
              }
            >
              <span className="views-variant-swatch" />
              <span className="views-variant-body">
                <strong>{v.label}</strong>
                <span>{v.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className="views-stage"
          data-mode={mode}
          data-variant={activeVariant}
          style={{ ['--user-accent' as string]: accent } as React.CSSProperties}
        >
          <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Multi-view grid">
            <Grid.Header>
              <div className="grid-row header-row views-header">
                <div className="cell">Name</div>
                <div className="cell">Department</div>
                <div className="cell">Role</div>
                <div className="cell">Salary</div>
                <div className="cell">Status</div>
              </div>
            </Grid.Header>
            <Grid.Body>
              <Row>
                <div className="grid-row views-row">
                  <Cell<Employee>
                    columnKey="name"
                    render={(_v, ctx) => <LabeledCell label="Name">{ctx.row.name}</LabeledCell>}
                  />
                  <Cell<Employee>
                    columnKey="department"
                    render={(_v, ctx) => <LabeledCell label="Department">{ctx.row.department}</LabeledCell>}
                  />
                  <Cell<Employee>
                    columnKey="role"
                    render={(_v, ctx) => <LabeledCell label="Role">{ctx.row.role}</LabeledCell>}
                  />
                  <Cell<Employee>
                    columnKey="salary"
                    render={(_v, ctx) => (
                      <LabeledCell label="Salary">${ctx.row.salary.toLocaleString()}</LabeledCell>
                    )}
                  />
                  <Cell<Employee>
                    columnKey="status"
                    render={(_v, ctx) => (
                      <LabeledCell label="Status">
                        <span className={`status-badge status-${ctx.row.status}`}>
                          {ctx.row.status}
                        </span>
                      </LabeledCell>
                    )}
                  />
                </div>
              </Row>
            </Grid.Body>
          </Grid>

          {mode === 'carousel' && (
            <>
              <button
                type="button"
                className="views-nav prev"
                onClick={() => scrollCarousel(-1)}
                aria-label="Previous card"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="views-nav next"
                onClick={() => scrollCarousel(1)}
                aria-label="Next card"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        <div className="views-footnote">
          <span>
            Mode <strong>{mode}</strong> · variant <strong>{activeVariantMeta.label}</strong> —{' '}
            {activeVariantMeta.blurb}
          </span>
          <span className="views-footnote-features">
            <code>@container</code>
            <code>@property</code>
            <code>color-mix()</code>
            <code>:has()</code>
            <code>scroll-snap</code>
            <code>aspect-ratio</code>
            <code>backdrop-filter</code>
            <code>::view-transition</code>
          </span>
        </div>
      </div>
    </section>
  )
}
