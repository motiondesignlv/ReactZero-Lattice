import React, { useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type Viewport = 'phone' | 'tablet' | 'desktop'

const viewports: { key: Viewport; label: string; width: string; icon: string }[] = [
  { key: 'phone', label: 'Phone', width: '375px', icon: '\u{1F4F1}' },
  { key: 'tablet', label: 'Tablet', width: '768px', icon: '\u{1F4BB}' },
  { key: 'desktop', label: 'Desktop', width: '100%', icon: '\u{1F5A5}' },
]

const code = `/* === RESPONSIVE CSS PATTERNS FOR LATTICE GRIDS === */

/* 1. CARD LAYOUT — rows become styled cards */
.responsive-card [data-lattice-body] {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem; padding: 0.75rem;
}
.responsive-card [data-lattice-row] {
  border: 1px solid var(--lattice-border);
  border-radius: var(--radius);
  overflow: hidden;
}

/* 2. COMPACT DENSITY — zebra + tight spacing */
.responsive-compact [data-lattice-cell] {
  padding: 0.3rem 0.625rem; font-size: 0.78rem;
}
.responsive-compact [data-lattice-row]:nth-child(even) {
  background: var(--lattice-surface);
}

/* 3. HORIZONTAL SCROLL — fixed widths, scroll */
.responsive-scroll [data-lattice-grid] { overflow-x: auto; }
.responsive-scroll .grid-row { min-width: 800px; }`

const data = employees.slice(0, 8)

function getTableCols(viewport: Viewport): string {
  if (viewport === 'phone') return '1.5fr 1fr 0.8fr'
  if (viewport === 'tablet') return '1.5fr 1fr 1.2fr 0.8fr'
  return '1.5fr 1fr 1.2fr 1fr 0.8fr 0.8fr'
}

function getTableHeaders(viewport: Viewport): string[] {
  if (viewport === 'phone') return ['Name', 'Role', 'Status']
  if (viewport === 'tablet') return ['Name', 'Department', 'Role', 'Status']
  return ['Name', 'Department', 'Role', 'Email', 'Status', 'Start Date']
}

export function ResponsiveGrid() {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [pattern, setPattern] = useState<'table' | 'card' | 'compact' | 'scroll'>('table')

  const containerWidth = viewports.find(v => v.key === viewport)!.width
  const isTable = pattern === 'table'
  const isCard = pattern === 'card'

  const tableCols = getTableCols(viewport)
  const tableHeaders = getTableHeaders(viewport)

  return (
    <ExampleSection
      id="responsive"
      title="Responsive CSS Patterns"
      description="Resize the viewport and switch patterns to see how pure CSS controls grid behavior on phone, tablet, and desktop. No JavaScript layout logic — all CSS."
      code={code}
    >
      {/* Viewport selector */}
      <div className="viewport-selector">
        {viewports.map(v => (
          <button
            key={v.key}
            className={`viewport-btn ${viewport === v.key ? 'active' : ''}`}
            onClick={() => setViewport(v.key)}
          >
            <span className="viewport-icon">{v.icon}</span>
            <span>{v.label}</span>
            <span className="viewport-size">{v.width}</span>
          </button>
        ))}
      </div>

      {/* Pattern selector */}
      <div className="pattern-selector">
        <span className="pattern-label">CSS Pattern:</span>
        {([
          { key: 'table' as const, label: 'Standard Table' },
          { key: 'card' as const, label: 'Card Layout' },
          { key: 'compact' as const, label: 'Compact Density' },
          { key: 'scroll' as const, label: 'Horizontal Scroll' },
        ]).map(p => (
          <button
            key={p.key}
            className={`pattern-btn ${pattern === p.key ? 'active' : ''}`}
            onClick={() => setPattern(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Active technique description */}
      <div className="responsive-hint">
        {isTable && 'Column count adapts to viewport. Phone: 3 columns, Tablet: 4, Desktop: all 6. Columns redistribute — no empty gaps.'}
        {isCard && 'Each row becomes a styled card with a hero header and labeled fields. Responsive grid auto-fills cards by available width.'}
        {pattern === 'compact' && 'Tighter padding, smaller font, zebra striping. Great for power users who want maximum density.'}
        {pattern === 'scroll' && 'Columns keep fixed widths. Container scrolls horizontally. Best for strict column alignment.'}
      </div>

      {/* Simulated viewport container */}
      <div className="viewport-frame" style={{ maxWidth: containerWidth }}>
        <div className="viewport-frame-bar">
          <span className="viewport-dot" />
          <span className="viewport-dot" />
          <span className="viewport-dot" />
          <span className="viewport-frame-title">{containerWidth} {viewport !== 'desktop' ? `— ${viewport}` : ''}</span>
        </div>
        <div className={`viewport-content responsive-wrapper responsive-${pattern}`}>
          <Grid data={data} rowKey="id" aria-label="Responsive grid">
            {/* Card layout: no header */}
            {!isCard && (
              <Grid.Header>
                <div
                  className={`grid-row header-row ${pattern === 'scroll' ? 'scroll-row' : ''}`}
                  style={
                    pattern === 'scroll'
                      ? { gridTemplateColumns: '180px 120px 160px 120px 100px 100px', minWidth: '800px' }
                      : { gridTemplateColumns: isTable ? tableCols : 'repeat(6, 1fr)' }
                  }
                >
                  {pattern === 'scroll'
                    ? ['Name', 'Department', 'Role', 'Email', 'Status', 'Start Date'].map(h => (
                        <div key={h} className="cell">{h}</div>
                      ))
                    : isTable
                      ? tableHeaders.map(h => <div key={h} className="cell">{h}</div>)
                      : ['Name', 'Department', 'Role', 'Email', 'Status', 'Start Date'].map(h => (
                          <div key={h} className="cell">{h}</div>
                        ))
                  }
                </div>
              </Grid.Header>
            )}

            <Grid.Body>
              <Row>
                {isCard ? (
                  /* ---- CARD LAYOUT ---- */
                  <div className="resp-card">
                    <Cell<Employee> columnKey="name" render={(_v, ctx) => (
                      <div className="resp-card-hero">
                        <div className="cell-with-avatar">
                          <div className="avatar">{ctx.row.name.split(' ').map(n => n[0]).join('')}</div>
                          <div className="cell-multiline">
                            <span className="cell-title">{ctx.row.name}</span>
                            <span className="cell-subtitle">{ctx.row.role}</span>
                          </div>
                        </div>
                        <span className={`status-badge status-${ctx.row.status}`}>{ctx.row.status}</span>
                      </div>
                    )} />
                    <Cell<Employee> columnKey="department" render={(_v, ctx) => (
                      <div className="resp-card-body">
                        <div className="resp-card-field">
                          <span className="resp-card-label">Department</span>
                          <span className="resp-card-value">{ctx.row.department}</span>
                        </div>
                        <div className="resp-card-field">
                          <span className="resp-card-label">Email</span>
                          <a href={`mailto:${ctx.row.email}`} className="cell-link">{ctx.row.email}</a>
                        </div>
                        <div className="resp-card-field">
                          <span className="resp-card-label">Salary</span>
                          <span className="resp-card-value resp-card-money">${ctx.row.salary.toLocaleString()}</span>
                        </div>
                        <div className="resp-card-field">
                          <span className="resp-card-label">Started</span>
                          <span className="resp-card-value">{ctx.row.startDate}</span>
                        </div>
                      </div>
                    )} />
                  </div>
                ) : pattern === 'scroll' ? (
                  /* ---- SCROLL PATTERN ---- */
                  <div className="grid-row scroll-row" style={{ gridTemplateColumns: '180px 120px 160px 120px 100px 100px', minWidth: '800px' }}>
                    <Cell columnKey="name" />
                    <Cell columnKey="department" />
                    <Cell columnKey="role" />
                    <Cell<Employee> columnKey="email" render={(_v, ctx) => (
                      <span className="cell-truncate-responsive">{ctx.row.email}</span>
                    )} />
                    <Cell columnKey="status" render={(v) => (
                      <span className={`status-badge status-${v}`}>{String(v)}</span>
                    )} />
                    <Cell columnKey="startDate" />
                  </div>
                ) : isTable ? (
                  /* ---- ADAPTIVE TABLE ---- */
                  <div className="grid-row" style={{ gridTemplateColumns: tableCols }}>
                    <Cell columnKey="name" />
                    {viewport !== 'phone' && <Cell columnKey="department" />}
                    <Cell columnKey="role" />
                    {viewport === 'desktop' && <Cell<Employee> columnKey="email" render={(_v, ctx) => (
                      <span className="cell-truncate-responsive">{ctx.row.email}</span>
                    )} />}
                    <Cell columnKey="status" render={(v) => (
                      <span className={`status-badge status-${v}`}>{String(v)}</span>
                    )} />
                    {viewport === 'desktop' && <Cell columnKey="startDate" />}
                  </div>
                ) : (
                  /* ---- COMPACT DENSITY ---- */
                  <div className="grid-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                    <Cell columnKey="name" />
                    <Cell columnKey="department" />
                    <Cell columnKey="role" />
                    <Cell<Employee> columnKey="email" render={(_v, ctx) => (
                      <span className="cell-truncate-responsive">{ctx.row.email}</span>
                    )} />
                    <Cell columnKey="status" render={(v) => (
                      <span className={`status-badge status-${v}`}>{String(v)}</span>
                    )} />
                    <Cell columnKey="startDate" />
                  </div>
                )}
              </Row>
            </Grid.Body>
          </Grid>
        </div>
      </div>

      {/* CSS technique explanation */}
      <div className="responsive-techniques">
        <h3>Key CSS Techniques Used</h3>
        <div className="technique-grid">
          <div className="technique-card">
            <strong>Adaptive Columns</strong>
            <p>Change <code>grid-template-columns</code> per breakpoint. Columns redistribute with no empty gaps.</p>
          </div>
          <div className="technique-card">
            <strong>Card from Grid</strong>
            <p>Override body to <code>display: grid</code> with <code>auto-fill</code>. Rows become standalone styled cards.</p>
          </div>
          <div className="technique-card">
            <strong>Zebra Striping</strong>
            <p>Use <code>:nth-child(even)</code> for alternating row colors. Paired with tight padding for dense views.</p>
          </div>
          <div className="technique-card">
            <strong>Horizontal Scroll</strong>
            <p>Set <code>overflow-x: auto</code> on the grid wrapper. Fixed column widths ensure consistent alignment.</p>
          </div>
        </div>
      </div>
    </ExampleSection>
  )
}
