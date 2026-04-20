import React, { useState } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const maxSalary = Math.max(...employees.map(e => e.salary))

const code = `
// Cells can render ANY React content via the render prop.
// (value, context) => ReactNode

// Multi-line: title + subtitle in one cell
<Cell columnKey="name" render={(_v, ctx) => (
  <div className="cell-with-avatar">
    <img className="avatar-img"
      src={\`https://i.pravatar.cc/40?u=\${ctx.row.email}\`} />
    <div className="cell-multiline">
      <span className="cell-title">{ctx.row.name}</span>
      <span className="cell-subtitle">{ctx.row.email}</span>
    </div>
  </div>
)} />

// Department + role (two-line cell)
<Cell columnKey="department" render={(_v, ctx) => (
  <div className="cell-multiline">
    <span className="cell-title">{ctx.row.department}</span>
    <span className="cell-subtitle">{ctx.row.role}</span>
  </div>
)} />

// Salary with progress bar
<Cell columnKey="salary" render={(value) => (
  <div className="salary-bar">
    <div className="salary-bar-track">
      <div className="salary-bar-fill"
        style={{ width: \`\${(value / max) * 100}%\` }} />
    </div>
    <span className="salary-amount">
      $\{Number(value).toLocaleString()}
    </span>
  </div>
)} />

// Link cell
<Cell columnKey="email" render={(value) => (
  <a href={\`mailto:\${value}\`} className="cell-link">
    Send email
  </a>
)} />

// Action buttons (using ctx.row)
<Cell render={(_v, ctx) => (
  <div className="cell-actions">
    <button className="action-btn action-btn-view"
      onClick={() => handleView(ctx.row)}>View</button>
    <button className="action-btn action-btn-edit"
      onClick={() => handleEdit(ctx.row)}>Edit</button>
    <button className="action-btn action-btn-danger"
      onClick={() => handleDelete(ctx.row)}>Del</button>
  </div>
)} />
`

export function RichContentGrid() {
  const [actionLog, setActionLog] = useState<string[]>([])

  const logAction = (action: string, row: Employee) => {
    setActionLog(prev => [`${action}: ${row.name} (${row.department})`, ...prev.slice(0, 4)])
  }

  return (
    <ExampleSection
      id="rich-content"
      title="Rich Content & Cell Actions"
      description="Cells showcase multiline text (title + subtitle), avatar images, progress bars, links, badges, and action buttons — all using the render prop."
      code={code}
    >
      <Grid data={employees} rowKey="id" aria-label="Rich content grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: '2fr 1.3fr 1.5fr 0.7fr 0.8fr 1.2fr' }}>
            <div className="cell">Employee</div>
            <div className="cell">Department / Role</div>
            <div className="cell">Salary</div>
            <div className="cell">Status</div>
            <div className="cell">Contact</div>
            <div className="cell">Actions</div>
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: '2fr 1.3fr 1.5fr 0.7fr 0.8fr 1.2fr' }}>
              {/* Multi-line: avatar image + name + email */}
              <Cell<Employee> columnKey="name" render={(_value, ctx) => (
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
              )} />

              {/* Two-line: department + role */}
              <Cell<Employee> columnKey="department" render={(_value, ctx) => (
                <div className="cell-multiline">
                  <span className="cell-title">{ctx.row.department}</span>
                  <span className="cell-subtitle">{ctx.row.role}</span>
                </div>
              )} />

              {/* Salary progress bar */}
              <Cell<Employee> columnKey="salary" render={(value) => (
                <div className="salary-bar">
                  <div className="salary-bar-track">
                    <div className="salary-bar-fill" style={{ width: `${(Number(value) / maxSalary) * 100}%` }} />
                  </div>
                  <span className="salary-amount">${Number(value).toLocaleString()}</span>
                </div>
              )} />

              {/* Status badge */}
              <Cell columnKey="status" render={(value) => (
                <span className={`status-badge status-${value}`}>{String(value)}</span>
              )} />

              {/* Link cell */}
              <Cell<Employee> columnKey="email" render={(_value, ctx) => (
                <a href={`mailto:${ctx.row.email}`} className="cell-link">
                  Send email
                </a>
              )} />

              {/* Action buttons */}
              <Cell<Employee> render={(_value, ctx) => (
                <div className="cell-actions">
                  <button className="action-btn action-btn-view" onClick={() => logAction('View', ctx.row)}>
                    View
                  </button>
                  <button className="action-btn action-btn-edit" onClick={() => logAction('Edit', ctx.row)}>
                    Edit
                  </button>
                  <button className="action-btn action-btn-danger" onClick={() => logAction('Delete', ctx.row)}>
                    Del
                  </button>
                </div>
              )} />
            </div>
          </Row>
        </Grid.Body>
      </Grid>
      {actionLog.length > 0 && (
        <div className="action-log">
          <strong>Action Log:</strong>
          {actionLog.map((entry, i) => (
            <div key={i} className="action-log-entry">{entry}</div>
          ))}
        </div>
      )}
    </ExampleSection>
  )
}
