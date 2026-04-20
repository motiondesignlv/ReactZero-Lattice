import React, { useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ColConfig = { key: keyof Employee & string; label: string }

const allColumns: ColConfig[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'status', label: 'Status' },
]

const defaultVisible = new Set(['name', 'department', 'role', 'salary', 'status'])

const code = `
const [visible, setVisible] = useState(new Set(['name','department','role','salary','status']))
const cols = allColumns.filter(c => visible.has(c.key))

<div className="column-picker">
  {allColumns.map(col => (
    <label key={col.key}>
      <input type="checkbox"
        checked={visible.has(col.key)}
        onChange={() => toggle(col.key)} />
      {col.label}
    </label>
  ))}
</div>

<Grid data={employees} rowKey="id">
  <Grid.Header>
    <div className="grid-row" style={{ gridTemplateColumns: \`repeat(\${cols.length}, 1fr)\` }}>
      {cols.map(c => <div className="cell" key={c.key}>{c.label}</div>)}
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row" style={{ gridTemplateColumns: \`repeat(\${cols.length}, 1fr)\` }}>
        {cols.map(c => <Cell key={c.key} columnKey={c.key} />)}
      </div>
    </Row>
  </Grid.Body>
</Grid>
`

export function ColumnPickerGrid() {
  const [visible, setVisible] = useState<Set<string>>(new Set(defaultVisible))

  const toggle = (key: string) => {
    setVisible(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const cols = allColumns.filter(c => visible.has(c.key))
  const gridCols = `repeat(${cols.length}, 1fr)`

  return (
    <ExampleSection
      id="column-picker"
      title="Column Picker"
      description="Toggle columns on and off with checkboxes. The grid layout adapts dynamically."
      code={code}
    >
      <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Column picker grid">
        <div className="column-picker">
          {allColumns.map(col => (
            <label key={col.key}>
              <input
                type="checkbox"
                checked={visible.has(col.key)}
                onChange={() => toggle(col.key)}
              />
              {col.label}
            </label>
          ))}
        </div>
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: gridCols }}>
            {cols.map(c => <div className="cell" key={c.key}>{c.label}</div>)}
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: gridCols }}>
              {cols.map(c => (
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
