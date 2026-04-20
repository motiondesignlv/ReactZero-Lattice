import React from 'react'
import { Grid, Row, Cell, Detail } from 'reactzero-lattice/react/components'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const code = `// Expandable rows use the existing expandedKeys state.
// Grid.Detail renders content only when the row is expanded.

<Grid data={employees} rowKey="id">
  <Grid.Body>
    <Row>
      <div className="grid-row">
        <Cell render={(_v, ctx) => (
          <button className="expand-btn"
            onClick={() => ctx.grid.dispatch({
              type: 'TOGGLE_EXPAND', payload: ctx.rowKey
            })}>
            <span className={\`expand-chevron
              \${ctx.isExpanded ? 'rotated' : ''}\`}>
              &#x25B6;
            </span>
          </button>
        )} />
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="status" />
      </div>

      <Grid.Detail>
        {(row) => (
          <div className="detail-panel">
            <div className="detail-grid">
              <div><strong>Email</strong> {row.email}</div>
              <div><strong>Salary</strong> $\{row.salary}</div>
            </div>
          </div>
        )}
      </Grid.Detail>
    </Row>
  </Grid.Body>
</Grid>`

export function ExpandableGrid() {
  return (
    <ExampleSection
      id="expandable"
      title="Expandable Rows"
      description="Click the chevron to expand a row's detail panel. Uses the built-in expandedKeys state and the new Grid.Detail component. The detail panel animates open with CSS."
      code={code}
    >
      <Grid data={employees} rowKey="id" aria-label="Expandable grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 0.8fr' }}>
            <div className="cell"></div>
            <div className="cell">Employee</div>
            <div className="cell">Department</div>
            <div className="cell">Role</div>
            <div className="cell">Status</div>
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row<Employee>
            className={({ isExpanded }) => isExpanded ? 'expanded' : ''}
          >
            <div className="grid-row" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 0.8fr' }}>
              <Cell<Employee> render={(_v, ctx) => (
                <button
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    ctx.grid.dispatch({ type: 'TOGGLE_EXPAND', payload: ctx.rowKey })
                  }}
                  aria-expanded={ctx.isExpanded}
                  aria-label="Expand row"
                >
                  <span className={`expand-chevron ${ctx.isExpanded ? 'rotated' : ''}`}>&#x25B6;</span>
                </button>
              )} />
              <Cell<Employee> columnKey="name" render={(_v, ctx) => (
                <div className="cell-with-avatar">
                  <img className="avatar-img" src={`https://i.pravatar.cc/40?u=${ctx.row.email}`} alt={ctx.row.name} />
                  <span>{ctx.row.name}</span>
                </div>
              )} />
              <Cell columnKey="department" />
              <Cell columnKey="role" />
              <Cell columnKey="status" render={(v) => (
                <span className={`status-badge status-${v}`}>{String(v)}</span>
              )} />
            </div>
            <Detail<Employee> className="detail-animated">
              {(row) => (
                <div className="detail-panel">
                  <div className="detail-grid">
                    <div className="detail-field">
                      <span className="detail-label">Email</span>
                      <a href={`mailto:${row.email}`} className="cell-link">{row.email}</a>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Salary</span>
                      <span className="detail-value">${row.salary.toLocaleString()}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Start Date</span>
                      <span className="detail-value">{row.startDate}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Employee ID</span>
                      <span className="detail-value">#{row.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </Detail>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
