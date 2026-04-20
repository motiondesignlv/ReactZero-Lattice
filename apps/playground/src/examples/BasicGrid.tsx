import React from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { employees } from '../data'
import { ExampleSection } from '../components/ExampleSection'

const code = `
<Grid data={employees.slice(0, 8)} rowKey="id">
  <Grid.Header>
    <div className="grid-row grid-cols-5 header-row">
      <div className="cell">ID</div>
      <div className="cell">Name</div>
      <div className="cell">Department</div>
      <div className="cell">Role</div>
      <div className="cell">Status</div>
    </div>
  </Grid.Header>
  <Grid.Body>
    <Row>
      <div className="grid-row grid-cols-5">
        <Cell columnKey="id" />
        <Cell columnKey="name" />
        <Cell columnKey="department" />
        <Cell columnKey="role" />
        <Cell columnKey="status" render={(value) => (
          <span className={\`status-badge status-\${value}\`}>
            {String(value)}
          </span>
        )} />
      </div>
    </Row>
  </Grid.Body>
</Grid>
`

export function BasicGrid() {
  return (
    <ExampleSection
      id="basic"
      title="Basic Grid"
      description="Minimal grid with no plugins. Just data and a row template with custom cell rendering."
      code={code}
    >
      <Grid data={employees.slice(0, 8)} rowKey="id" aria-label="Basic employee grid">
        <Grid.Header>
          <div className="grid-row grid-cols-5 header-row">
            <div className="cell">ID</div>
            <div className="cell">Name</div>
            <div className="cell">Department</div>
            <div className="cell">Role</div>
            <div className="cell">Status</div>
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row grid-cols-5">
              <Cell columnKey="id" />
              <Cell columnKey="name" />
              <Cell columnKey="department" />
              <Cell columnKey="role" />
              <Cell columnKey="status" render={(value) => (
                <span className={`status-badge status-${value}`}>{String(value)}</span>
              )} />
            </div>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
