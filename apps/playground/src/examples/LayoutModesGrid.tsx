import React, { useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ViewMode = 'table' | 'table-minimal' | 'card' | 'list'
type CardPreset = 'vertical' | 'horizontal' | 'compact' | 'profile' | 'magazine'
type CardColumns = 'auto' | '1' | '2' | '3' | '4'

const viewModes: { key: ViewMode; label: string; desc: string }[] = [
  { key: 'table', label: 'Table', desc: 'Standard table with header' },
  { key: 'table-minimal', label: 'Minimal Table', desc: 'No header, clean rows' },
  { key: 'card', label: 'Card Grid', desc: 'Cards in responsive columns' },
  { key: 'list', label: 'List / Stack', desc: 'Full-width horizontal cards' },
]

const presets: { key: CardPreset; label: string; desc: string }[] = [
  { key: 'vertical', label: 'Vertical', desc: 'Hero top, fields below in grid' },
  { key: 'horizontal', label: 'Horizontal', desc: 'Avatar left, fields right' },
  { key: 'compact', label: 'Compact', desc: 'Tight single-column fields' },
  { key: 'profile', label: 'Profile', desc: 'Centered avatar, name prominent' },
  { key: 'magazine', label: 'Magazine', desc: 'Large header area, editorial feel' },
]

const columnOptions: { key: CardColumns; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: '1', label: '1 col' },
  { key: '2', label: '2 cols' },
  { key: '3', label: '3 cols' },
  { key: '4', label: '4 cols' },
]

type FieldKey = 'department' | 'role' | 'salary' | 'status' | 'startDate' | 'email'
const allFields: { key: FieldKey; label: string }[] = [
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'status', label: 'Status' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'email', label: 'Email' },
]

const code = `// Layout is 100% CSS custom properties + data attributes.
// JS only sets vars on the wrapper — zero layout logic in code.

<div
  className="view-card card-style-vertical"
  data-card-dir="column"
  data-hero-layout="row"
  data-field-dir="row"
  data-field-cols="2"
  style={{
    '--card-min-w': '280px',
    '--card-gap': '14px',
    '--card-padding': '0px',
    '--field-cols': '1fr 1fr',
    '--field-gap': '0px',
  }}
>
  <Grid data={employees} rowKey="id">
    <Grid.Body>
      <Row>
        <div className="layout-card-content">
          <Cell columnKey="name" render={...} />
          <div className="layout-fields-body">
            <Cell columnKey="department" render={...} />
          </div>
        </div>
      </Row>
    </Grid.Body>
  </Grid>
</div>

// Data attributes control layout direction:
//   data-card-dir="column|row"
//   data-hero-layout="row|column"
//   data-field-dir="row|column"
//   data-field-cols="1|2|3"
//
// CSS vars control spacing & sizing:
//   --card-min-w, --card-gap, --card-padding
//   --field-cols, --field-gap`

const data = employees.slice(0, 8)

// --- Preset definitions: each sets all layout properties ---
type LayoutState = {
  cardDirection: 'column' | 'row'
  heroLayout: 'row' | 'column'
  fieldCols: 1 | 2 | 3
  fieldDirection: 'row' | 'column'
  cardMinWidth: number
  cardGap: number
  cardPadding: number
  fieldGap: number
}

const presetDefaults: Record<CardPreset, LayoutState> = {
  vertical: {
    cardDirection: 'column', heroLayout: 'row', fieldCols: 2, fieldDirection: 'row',
    cardMinWidth: 280, cardGap: 14, cardPadding: 0, fieldGap: 0,
  },
  horizontal: {
    cardDirection: 'row', heroLayout: 'column', fieldCols: 1, fieldDirection: 'row',
    cardMinWidth: 420, cardGap: 14, cardPadding: 0, fieldGap: 0,
  },
  compact: {
    cardDirection: 'column', heroLayout: 'row', fieldCols: 1, fieldDirection: 'row',
    cardMinWidth: 220, cardGap: 10, cardPadding: 0, fieldGap: 0,
  },
  profile: {
    cardDirection: 'column', heroLayout: 'column', fieldCols: 2, fieldDirection: 'column',
    cardMinWidth: 260, cardGap: 14, cardPadding: 0, fieldGap: 0,
  },
  magazine: {
    cardDirection: 'column', heroLayout: 'row', fieldCols: 2, fieldDirection: 'row',
    cardMinWidth: 300, cardGap: 14, cardPadding: 0, fieldGap: 0,
  },
}

function getColsStyle(cols: CardColumns, minWidth: number): string {
  if (cols === '1') return 'repeat(1, 1fr)'
  if (cols === '2') return 'repeat(2, 1fr)'
  if (cols === '3') return 'repeat(3, 1fr)'
  if (cols === '4') return 'repeat(4, 1fr)'
  return `repeat(auto-fill, minmax(${minWidth}px, 1fr))`
}

function getFieldColsCSS(n: 1 | 2 | 3): string {
  if (n === 1) return '1fr'
  if (n === 2) return '1fr 1fr'
  return '1fr 1fr 1fr'
}

function FieldValue({ field, row }: { field: FieldKey; row: Employee }) {
  if (field === 'salary') return <span className="layout-value layout-money">${row.salary.toLocaleString()}</span>
  if (field === 'status') return <span className={`status-badge status-${row.status}`}>{row.status}</span>
  return <span className="layout-value">{String(row[field])}</span>
}

export function LayoutModesGrid() {
  const [mode, setMode] = useState<ViewMode>('card')
  const [preset, setPreset] = useState<CardPreset>('vertical')
  const [cardCols, setCardCols] = useState<CardColumns>('auto')
  const [visibleFields, setVisibleFields] = useState<Set<FieldKey>>(
    new Set(['department', 'role', 'salary', 'status'])
  )

  // Individual layout controls (initialized from preset)
  const [cardDirection, setCardDirection] = useState<'column' | 'row'>('column')
  const [heroLayout, setHeroLayout] = useState<'row' | 'column'>('row')
  const [fieldCols, setFieldCols] = useState<1 | 2 | 3>(2)
  const [fieldDirection, setFieldDirection] = useState<'row' | 'column'>('row')
  const [cardMinWidth, setCardMinWidth] = useState(280)
  const [cardGap, setCardGap] = useState(14)
  const [cardPadding, setCardPadding] = useState(0)
  const [fieldGap, setFieldGap] = useState(0)

  const showHeader = mode === 'table'
  const isCardOrList = mode === 'card' || mode === 'list'
  const isCard = mode === 'card'

  const applyPreset = (p: CardPreset) => {
    setPreset(p)
    const d = presetDefaults[p]
    setCardDirection(d.cardDirection)
    setHeroLayout(d.heroLayout)
    setFieldCols(d.fieldCols)
    setFieldDirection(d.fieldDirection)
    setCardMinWidth(d.cardMinWidth)
    setCardGap(d.cardGap)
    setCardPadding(d.cardPadding)
    setFieldGap(d.fieldGap)
  }

  const toggleField = (key: FieldKey) => {
    setVisibleFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const fields = allFields.filter(f => visibleFields.has(f.key))

  // Build CSS custom properties for the wrapper
  const wrapperStyle = isCard ? {
    '--card-cols': getColsStyle(cardCols, cardMinWidth),
    '--card-gap': `${cardGap}px`,
    '--card-min-w': `${cardMinWidth}px`,
    '--card-padding': `${cardPadding}px`,
    '--field-cols': getFieldColsCSS(fieldCols),
    '--field-gap': `${fieldGap}px`,
  } as React.CSSProperties : undefined

  return (
    <ExampleSection
      id="layout-modes"
      title="Layout Modes"
      description="Same Grid component, same data — completely different layouts. Toggle views, pick a preset, or fine-tune every layout property with CSS custom properties."
      code={code}
    >
      {/* Mode selector */}
      <div className="view-mode-selector">
        {viewModes.map(v => (
          <button
            key={v.key}
            className={`view-mode-btn ${mode === v.key ? 'active' : ''}`}
            onClick={() => setMode(v.key)}
            title={v.desc}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Card configuration panel — only when in card or list mode */}
      {isCardOrList && (
        <div className="card-config">
          {/* Presets */}
          <div className="card-config-section">
            <span className="card-config-label">Preset</span>
            <div className="card-config-options">
              {presets.map(p => (
                <button
                  key={p.key}
                  className={`card-config-btn ${preset === p.key ? 'active' : ''}`}
                  onClick={() => applyPreset(p.key)}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card Direction */}
          <div className="card-config-section">
            <span className="card-config-label">Card Dir</span>
            <div className="card-config-options">
              {(['column', 'row'] as const).map(d => (
                <button
                  key={d}
                  className={`card-config-btn ${cardDirection === d ? 'active' : ''}`}
                  onClick={() => setCardDirection(d)}
                >
                  {d === 'column' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Layout */}
          <div className="card-config-section">
            <span className="card-config-label">Hero</span>
            <div className="card-config-options">
              {(['row', 'column'] as const).map(d => (
                <button
                  key={d}
                  className={`card-config-btn ${heroLayout === d ? 'active' : ''}`}
                  onClick={() => setHeroLayout(d)}
                >
                  {d === 'row' ? 'Inline' : 'Stacked'}
                </button>
              ))}
            </div>
          </div>

          {/* Field Columns */}
          <div className="card-config-section">
            <span className="card-config-label">Field Cols</span>
            <div className="card-config-options">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  className={`card-config-btn ${fieldCols === n ? 'active' : ''}`}
                  onClick={() => setFieldCols(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Field Direction */}
          <div className="card-config-section">
            <span className="card-config-label">Field Dir</span>
            <div className="card-config-options">
              {(['row', 'column'] as const).map(d => (
                <button
                  key={d}
                  className={`card-config-btn ${fieldDirection === d ? 'active' : ''}`}
                  onClick={() => setFieldDirection(d)}
                >
                  {d === 'row' ? 'Inline' : 'Stacked'}
                </button>
              ))}
            </div>
          </div>

          {/* Card Min Width — slider */}
          {isCard && (
            <div className="card-config-section">
              <span className="card-config-label">Card Min W</span>
              <div className="config-slider-group">
                <input
                  type="range" className="config-slider"
                  min={180} max={500} value={cardMinWidth}
                  onChange={(e) => setCardMinWidth(Number(e.target.value))}
                />
                <span className="config-slider-value">{cardMinWidth}px</span>
              </div>
            </div>
          )}

          {/* Grid Columns — only for card grid mode */}
          {isCard && (
            <div className="card-config-section">
              <span className="card-config-label">Columns</span>
              <div className="card-config-options">
                {columnOptions.map(c => (
                  <button
                    key={c.key}
                    className={`card-config-btn ${cardCols === c.key ? 'active' : ''}`}
                    onClick={() => setCardCols(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Gap — slider */}
          {isCard && (
            <div className="card-config-section">
              <span className="card-config-label">Card Gap</span>
              <div className="config-slider-group">
                <input
                  type="range" className="config-slider"
                  min={0} max={32} value={cardGap}
                  onChange={(e) => setCardGap(Number(e.target.value))}
                />
                <span className="config-slider-value">{cardGap}px</span>
              </div>
            </div>
          )}

          {/* Card Padding — slider */}
          <div className="card-config-section">
            <span className="card-config-label">Card Pad</span>
            <div className="config-slider-group">
              <input
                type="range" className="config-slider"
                min={0} max={24} value={cardPadding}
                onChange={(e) => setCardPadding(Number(e.target.value))}
              />
              <span className="config-slider-value">{cardPadding}px</span>
            </div>
          </div>

          {/* Field Gap — slider */}
          <div className="card-config-section">
            <span className="card-config-label">Field Gap</span>
            <div className="config-slider-group">
              <input
                type="range" className="config-slider"
                min={0} max={16} value={fieldGap}
                onChange={(e) => setFieldGap(Number(e.target.value))}
              />
              <span className="config-slider-value">{fieldGap}px</span>
            </div>
          </div>

          {/* Field visibility toggles */}
          <div className="card-config-section">
            <span className="card-config-label">Fields</span>
            <div className="card-config-options">
              {allFields.map(f => (
                <label key={f.key} className="card-field-toggle">
                  <input
                    type="checkbox"
                    checked={visibleFields.has(f.key)}
                    onChange={() => toggleField(f.key)}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className={`view-${mode} card-style-${preset}`}
        data-card-dir={isCardOrList ? cardDirection : undefined}
        data-hero-layout={isCardOrList ? heroLayout : undefined}
        data-field-dir={isCardOrList ? fieldDirection : undefined}
        data-field-cols={isCardOrList ? String(fieldCols) : undefined}
        style={wrapperStyle}
      >
        <Grid data={data} rowKey="id" aria-label="Layout modes grid">
          {showHeader && (
            <Grid.Header>
              <div className="grid-row header-row" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 0.8fr' }}>
                <div className="cell">Employee</div>
                <div className="cell">Department</div>
                <div className="cell">Role</div>
                <div className="cell">Salary</div>
                <div className="cell">Status</div>
              </div>
            </Grid.Header>
          )}
          <Grid.Body>
            <Row>
              {isCardOrList ? (
                <div className="layout-card-content">
                  {/* Hero section — always rendered */}
                  <Cell<Employee> columnKey="name" render={(_v, ctx) => (
                    <div className="layout-field layout-field-hero">
                      <div className="cell-with-avatar">
                        <img
                          className="avatar-img"
                          src={`https://i.pravatar.cc/40?u=${ctx.row.email}`}
                          alt={ctx.row.name}
                        />
                        <div className="cell-multiline">
                          <span className="cell-title">{ctx.row.name}</span>
                          <span className="cell-subtitle">{ctx.row.email}</span>
                        </div>
                      </div>
                      {/* Status badge in hero */}
                      <span className={`status-badge status-${ctx.row.status} layout-hero-badge`}>{ctx.row.status}</span>
                    </div>
                  )} />

                  {/* Profile-specific centered area */}
                  {preset === 'profile' && (
                    <Cell<Employee> columnKey="role" render={(_v, ctx) => (
                      <div className="layout-profile-center">
                        <span className="layout-profile-role">{ctx.row.role}</span>
                        <span className="layout-profile-dept">{ctx.row.department}</span>
                      </div>
                    )} />
                  )}

                  {/* Dynamic fields based on visibility toggles */}
                  <div className="layout-fields-body">
                    {fields.map(f => (
                      <Cell<Employee>
                        key={f.key}
                        columnKey={f.key as any}
                        render={(_v, ctx) => (
                          <div className="layout-field">
                            <span className="layout-label">{f.label}</span>
                            <FieldValue field={f.key} row={ctx.row} />
                          </div>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid-row" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 0.8fr' }}>
                  <Cell<Employee> columnKey="name" render={(_v, ctx) => (
                    <div className="cell-with-avatar">
                      <img
                        className="avatar-img"
                        src={`https://i.pravatar.cc/40?u=${ctx.row.email}`}
                        alt={ctx.row.name}
                      />
                      <div className="cell-multiline">
                        <span className="cell-title">{ctx.row.name}</span>
                        {mode === 'table' && <span className="cell-subtitle">{ctx.row.email}</span>}
                      </div>
                    </div>
                  )} />
                  <Cell columnKey="department" />
                  <Cell columnKey="role" />
                  <Cell<Employee> columnKey="salary" render={(_v, ctx) => (
                    <span>${ctx.row.salary.toLocaleString()}</span>
                  )} />
                  <Cell columnKey="status" render={(v) => (
                    <span className={`status-badge status-${v}`}>{String(v)}</span>
                  )} />
                </div>
              )}
            </Row>
          </Grid.Body>
        </Grid>
      </div>
    </ExampleSection>
  )
}
