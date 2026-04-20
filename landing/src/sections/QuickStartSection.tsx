import { CodeBlock } from '../components/CodeBlock'

const installCode = `npm install @reactzero/lattice
# core, react bindings, and all plugins ship in a single tree-shakable package`

const usageCode = `import { Grid, Row, Cell } from '@reactzero/lattice/react/components'

const employees = [
  { id: 1, name: 'Alice', role: 'Engineer', salary: 135000 },
  { id: 2, name: 'Bob',   role: 'Designer', salary: 120000 },
  // ...
]

export function EmployeeTable() {
  return (
    <Grid data={employees} rowKey="id">
      <Grid.Header>
        <div className="grid-row grid-cols-3 header-row">
          <div className="cell">Name</div>
          <div className="cell">Role</div>
          <div className="cell">Salary</div>
        </div>
      </Grid.Header>
      <Grid.Body>
        <Row>
          <div className="grid-row grid-cols-3">
            <Cell columnKey="name" />
            <Cell columnKey="role" />
            <Cell columnKey="salary" render={(v) => \`$\${v.toLocaleString()}\`} />
          </div>
        </Row>
      </Grid.Body>
    </Grid>
  )
}`

export function QuickStartSection() {
  return (
    <section className="section" id="quickstart">
      <div className="container">
        <div className="section-label">Quick start</div>
        <h2 className="section-title">From install to rendered grid in 60 seconds</h2>
        <p className="section-desc">
          Install the React bindings, drop your data in, and compose the grid with the same primitives you already know.
          No column configuration DSL, no render prop soup.
        </p>
        <div className="quickstart-grid">
          <div className="quickstart-card">
            <div className="quickstart-card-header">1 · Install</div>
            <CodeBlock code={installCode} language="bash" />
          </div>
          <div className="quickstart-card">
            <div className="quickstart-card-header">2 · Render</div>
            <CodeBlock code={usageCode} />
          </div>
        </div>
      </div>
    </section>
  )
}
