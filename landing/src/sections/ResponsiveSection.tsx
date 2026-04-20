import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { employees, type Employee } from '../data/sampleData'
import { ExampleCard } from '../components/ExampleCard'

const code = `/* Every cell is rendered unconditionally. Layout is 100% CSS —
   container queries flip between table, tablet, and card modes. */

.responsive-frame {
  container-type: inline-size;   /* opt into container queries */
  resize: horizontal;             /* native drag handle at bottom-right */
  overflow: auto;
  min-width: 320px;
  max-width: 100%;
}

.responsive-demo .grid-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.1fr 1.4fr 0.9fr 0.9fr;
}

/* Tablet: drop email + start date */
@container (max-width: 780px) {
  .responsive-demo .grid-row {
    grid-template-columns: 1.4fr 1fr 1.1fr 0.9fr;
  }
  .responsive-demo .col-email,
  .responsive-demo .col-startDate { display: none; }
}

/* Phone: cards — header hides, rows stack, each cell is a label/value pair */
@container (max-width: 520px) {
  .responsive-demo .header-row { display: none; }
  .responsive-demo .grid-row {
    display: block;
    border: 1px solid var(--lattice-border);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
  }
  .responsive-demo [data-lattice-cell] {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
  }
  .responsive-demo .cell-label { display: inline; font-weight: 600; }
}

/* Label span is hidden on desktop / tablet, CSS reveals it on mobile */
.responsive-demo .cell-label { display: none; }`

function CardCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="cell-label">{label}</span>
      <span className="cell-value">{children}</span>
    </>
  )
}

export function ResponsiveSection() {
  return (
    <section className="section" id="responsive">
      <div className="container">
        <div className="section-label">Responsive · CSS-driven</div>
        <h2 className="section-title">One grid, every viewport — in pure CSS</h2>
        <p className="section-desc">
          No <code>window.resize</code> listeners. No conditional rendering. The same JSX renders every cell
          every time, and CSS container queries decide which columns to show and whether the grid looks like a
          table or a stack of cards. Drag the handle in the bottom-right corner of the frame to shrink the
          container — the native <code>resize: horizontal</code> CSS gives you that for free.
        </p>

        <ExampleCard
          title="Container-query responsive grid"
          description="Resize by dragging the bottom-right corner. At ~780px the email / start date columns disappear; under ~520px the row becomes a labeled card."
          code={code}
        >
          <div className="responsive-frame">
            <div className="responsive-demo">
              <Grid data={employees.slice(0, 6)} rowKey="id" aria-label="Responsive grid">
                <Grid.Header>
                  <div className="grid-row header-row">
                    <div className="cell col-name">Name</div>
                    <div className="cell col-department">Department</div>
                    <div className="cell col-role">Role</div>
                    <div className="cell col-email">Email</div>
                    <div className="cell col-salary">Salary</div>
                    <div className="cell col-startDate">Started</div>
                  </div>
                </Grid.Header>
                <Grid.Body>
                  <Row>
                    <div className="grid-row">
                      <Cell<Employee>
                        columnKey="name"
                        className="col-name"
                        render={(_v, ctx) => <CardCell label="Name">{ctx.row.name}</CardCell>}
                      />
                      <Cell<Employee>
                        columnKey="department"
                        className="col-department"
                        render={(_v, ctx) => (
                          <CardCell label="Department">{ctx.row.department}</CardCell>
                        )}
                      />
                      <Cell<Employee>
                        columnKey="role"
                        className="col-role"
                        render={(_v, ctx) => <CardCell label="Role">{ctx.row.role}</CardCell>}
                      />
                      <Cell<Employee>
                        columnKey="email"
                        className="col-email"
                        render={(_v, ctx) => (
                          <CardCell label="Email">
                            <a href={`mailto:${ctx.row.email}`} className="cell-link">
                              {ctx.row.email}
                            </a>
                          </CardCell>
                        )}
                      />
                      <Cell<Employee>
                        columnKey="salary"
                        className="col-salary"
                        render={(_v, ctx) => (
                          <CardCell label="Salary">${ctx.row.salary.toLocaleString()}</CardCell>
                        )}
                      />
                      <Cell<Employee>
                        columnKey="startDate"
                        className="col-startDate"
                        render={(_v, ctx) => (
                          <CardCell label="Started">{ctx.row.startDate}</CardCell>
                        )}
                      />
                    </div>
                  </Row>
                </Grid.Body>
              </Grid>
            </div>
          </div>

          <div className="responsive-legend">
            <div className="responsive-legend-item">
              <span className="responsive-dot desktop" /> ≥ 780px &nbsp;— table with 6 columns
            </div>
            <div className="responsive-legend-item">
              <span className="responsive-dot tablet" /> 520–780px — drops email &amp; start date
            </div>
            <div className="responsive-legend-item">
              <span className="responsive-dot phone" /> &lt; 520px &nbsp;— cards with labels
            </div>
          </div>
        </ExampleCard>
      </div>
    </section>
  )
}
