import React, { useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ColWidth = { key: keyof Employee & string; label: string; width: number; minWidth: number }

const defaultColumns: ColWidth[] = [
  { key: 'name', label: 'Name', width: 200, minWidth: 100 },
  { key: 'department', label: 'Department', width: 150, minWidth: 80 },
  { key: 'role', label: 'Role', width: 180, minWidth: 100 },
  { key: 'salary', label: 'Salary', width: 120, minWidth: 80 },
  { key: 'status', label: 'Status', width: 100, minWidth: 60 },
]

const code = `
// Column widths are controlled via CSS grid-template-columns.
// You can use px, fr, minmax(), or any valid CSS grid value.

const [columns, setColumns] = useState([
  { key: 'name', label: 'Name', width: 200 },
  { key: 'department', label: 'Department', width: 150 },
  { key: 'role', label: 'Role', width: 180 },
  { key: 'salary', label: 'Salary', width: 120 },
  { key: 'status', label: 'Status', width: 100 },
])

// Generate CSS grid-template-columns from column widths
const gridCols = columns.map(c => \`\${c.width}px\`).join(' ')

// Width controls per column
{columns.map((col, i) => (
  <div key={col.key}>
    <label>{col.label}: {col.width}px</label>
    <input type="range" min={80} max={400}
      value={col.width}
      onChange={(e) => updateWidth(i, Number(e.target.value))} />
  </div>
))}

<Grid data={employees} rowKey="id">
  <Grid.Header>
    <div className="grid-row" style={{ gridTemplateColumns: gridCols }}>
      {columns.map(c => <div key={c.key}>{c.label}</div>)}
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row" style={{ gridTemplateColumns: gridCols }}>
        {columns.map(c => <Cell key={c.key} columnKey={c.key} />)}
      </div>
    </Row>
  </Grid.Body>
</Grid>
`

export function ColumnWidthsGrid() {
  const [columns, setColumns] = useState<ColWidth[]>(defaultColumns)

  const updateWidth = (index: number, width: number) => {
    setColumns(prev => prev.map((col, i) =>
      i === index ? { ...col, width: Math.max(col.minWidth, width) } : col
    ))
  }

  const resetWidths = () => setColumns(defaultColumns)

  const gridCols = columns.map(c => `${c.width}px`).join(' ')

  return (
    <ExampleSection
      id="column-widths"
      title="Column Widths"
      description="Drag the sliders to resize columns. Widths are driven by CSS grid-template-columns from column state."
      code={code}
    >
      <div className="width-controls">
        {columns.map((col, i) => (
          <div key={col.key} className="width-control">
            <label>{col.label}: <strong>{col.width}px</strong></label>
            <input
              type="range"
              min={col.minWidth}
              max={400}
              value={col.width}
              onChange={(e) => updateWidth(i, Number(e.target.value))}
              className="width-slider"
            />
          </div>
        ))}
        <button onClick={resetWidths} className="clear-btn">Reset</button>
      </div>
      <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Column widths grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: gridCols }}>
            {columns.map(c => <div className="cell" key={c.key}>{c.label}</div>)}
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: gridCols }}>
              {columns.map(c => (
                <Cell
                  key={c.key}
                  columnKey={c.key}
                  render={c.key === 'salary'
                    ? (v) => `$${Number(v).toLocaleString()}`
                    : c.key === 'status'
                    ? (v) => <span className={`status-badge status-${v}`}>{String(v)}</span>
                    : undefined
                  }
                />
              ))}
            </div>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
