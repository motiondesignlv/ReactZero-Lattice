import React, { useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ColConfig = { key: keyof Employee & string; label: string }

const defaultOrder: ColConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'status', label: 'Status' },
]

const code = `
const [columns, setColumns] = useState(defaultOrder)

function moveColumn(index: number, dir: -1 | 1) {
  setColumns(prev => {
    const next = [...prev]
    const target = index + dir
    if (target < 0 || target >= next.length) return prev
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
}

<Grid data={employees} rowKey="id">
  <Grid.Header>
    <div className="grid-row" style={{...}}>
      {columns.map((col, i) => (
        <div className="cell reorder-header" key={col.key}>
          <button onClick={() => moveColumn(i, -1)}>◀</button>
          {col.label}
          <button onClick={() => moveColumn(i, 1)}>▶</button>
        </div>
      ))}
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row" style={{...}}>
        {columns.map(col => (
          <Cell key={col.key} columnKey={col.key} />
        ))}
      </div>
    </Row>
  </Grid.Body>
</Grid>
`

export function ColumnReorderGrid() {
  const [columns, setColumns] = useState<ColConfig[]>(defaultOrder)

  function moveColumn(index: number, dir: -1 | 1) {
    setColumns(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index]!, next[target]!] = [next[target]!, next[index]!]
      return next
    })
  }

  const gridCols = `repeat(${columns.length}, 1fr)`

  return (
    <ExampleSection
      id="column-reorder"
      title="Column Reorder"
      description="Use the arrow buttons to rearrange columns. Column order is maintained in local state."
      code={code}
    >
      <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Column reorder grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((col, i) => (
              <div className="cell reorder-header" key={col.key}>
                <button
                  className="reorder-btn"
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                >
                  &#9664;
                </button>
                <span>{col.label}</span>
                <button
                  className="reorder-btn"
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === columns.length - 1}
                >
                  &#9654;
                </button>
              </div>
            ))}
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: gridCols }}>
              {columns.map(col => (
                <Cell
                  key={col.key}
                  columnKey={col.key}
                  render={col.key === 'salary'
                    ? (v) => `$${Number(v).toLocaleString()}`
                    : col.key === 'status'
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
