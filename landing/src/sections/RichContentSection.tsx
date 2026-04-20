import { useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const maxSalary = Math.max(...employees.map((e) => e.salary))

const code = `// Cells accept any React content via the render prop: (value, ctx) => ReactNode

// Multi-line cell with avatar + title + subtitle
<Cell<Employee> columnKey="name" render={(_v, ctx) => (
  <div className="cell-with-avatar">
    <img className="avatar-img"
         src={\`https://i.pravatar.cc/40?u=\${ctx.row.email}\`} />
    <div className="cell-multiline">
      <span className="cell-title">{ctx.row.name}</span>
      <span className="cell-subtitle">{ctx.row.email}</span>
    </div>
  </div>
)} />

// Two-line metadata cell (department / role)
<Cell<Employee> columnKey="department" render={(_v, ctx) => (
  <div className="cell-multiline">
    <span className="cell-title">{ctx.row.department}</span>
    <span className="cell-subtitle">{ctx.row.role}</span>
  </div>
)} />

// Progress-bar cell
<Cell<Employee> columnKey="salary" render={(v) => (
  <div className="salary-bar">
    <div className="salary-bar-track">
      <div className="salary-bar-fill"
           style={{ width: \`\${(Number(v) / max) * 100}%\` }} />
    </div>
    <span className="salary-amount">\${Number(v).toLocaleString()}</span>
  </div>
)} />

// Badge cell
<Cell columnKey="status" render={(v) => (
  <span className={\`status-badge status-\${v}\`}>{String(v)}</span>
)} />

// Link cell
<Cell<Employee> columnKey="email" render={(_v, ctx) => (
  <a href={\`mailto:\${ctx.row.email}\`} className="cell-link">Send email</a>
)} />

// Action buttons — no columnKey, just ctx.row
<Cell<Employee> render={(_v, ctx) => (
  <div className="cell-actions">
    <button className="action-btn action-btn-view"   onClick={() => onView(ctx.row)}>View</button>
    <button className="action-btn action-btn-edit"   onClick={() => onEdit(ctx.row)}>Edit</button>
    <button className="action-btn action-btn-danger" onClick={() => onDelete(ctx.row)}>Del</button>
  </div>
)} />`

const template = { gridTemplateColumns: '2fr 1.3fr 1.5fr 0.8fr 0.9fr 1.2fr' }

export function RichContentSection() {
  const [log, setLog] = useState<string[]>([])
  const push = (action: string, row: Employee) =>
    setLog((prev) => [`${action} → ${row.name} (${row.department})`, ...prev.slice(0, 3)])

  return (
    <section className="section" id="rich-content">
      <div className="container">
        <div className="section-label">Rich content</div>
        <h2 className="section-title">Every cell is a React component</h2>
        <p className="section-desc">
          Lattice never tells you what a cell should look like. The <code>render</code> prop hands you the raw
          value and the row context — from there you can stack multiple lines, embed avatars, link out, show
          progress bars, or mount a row of action buttons. Align them with a flexible grid template and you’re
          free to organize the layout however the data needs.
        </p>

        <ExampleCard
          title="Rich employee directory"
          description="Avatars, two-line metadata cells, progress bars, badges, links, and action buttons — every pattern in one grid."
          code={code}
        >
          <div className="table-scroll">
          <Grid data={employees.slice(0, 10)} rowKey="id" aria-label="Rich content grid">
            <Grid.Header>
              <div className="grid-row header-row" style={template}>
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
                <div className="grid-row" style={template}>
                  <Cell<Employee>
                    columnKey="name"
                    render={(_v, ctx) => (
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
                    )}
                  />

                  <Cell<Employee>
                    columnKey="department"
                    render={(_v, ctx) => (
                      <div className="cell-multiline">
                        <span className="cell-title">{ctx.row.department}</span>
                        <span className="cell-subtitle">{ctx.row.role}</span>
                      </div>
                    )}
                  />

                  <Cell<Employee>
                    columnKey="salary"
                    render={(value) => (
                      <div className="salary-bar">
                        <div className="salary-bar-track">
                          <div
                            className="salary-bar-fill"
                            style={{ width: `${(Number(value) / maxSalary) * 100}%` }}
                          />
                        </div>
                        <span className="salary-amount">${Number(value).toLocaleString()}</span>
                      </div>
                    )}
                  />

                  <Cell
                    columnKey="status"
                    render={(value) => (
                      <span className={`status-badge status-${value}`}>{String(value)}</span>
                    )}
                  />

                  <Cell<Employee>
                    columnKey="email"
                    render={(_v, ctx) => (
                      <a href={`mailto:${ctx.row.email}`} className="cell-link">
                        Send email
                      </a>
                    )}
                  />

                  <Cell<Employee>
                    render={(_v, ctx) => (
                      <div className="cell-actions">
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => push('View', ctx.row)}
                        >
                          View
                        </button>
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => push('Edit', ctx.row)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn action-btn-danger"
                          onClick={() => push('Delete', ctx.row)}
                        >
                          Del
                        </button>
                      </div>
                    )}
                  />
                </div>
              </Row>
            </Grid.Body>
          </Grid>
          </div>
          {log.length > 0 && (
            <div className="action-log">
              <strong>Recent actions</strong>
              {log.map((entry, i) => (
                <div key={i} className="action-log-entry">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </ExampleCard>
      </div>
    </section>
  )
}
