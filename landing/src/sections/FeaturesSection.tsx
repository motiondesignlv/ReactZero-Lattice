const features = [
  {
    icon: '◯',
    title: 'Zero runtime dependencies',
    desc: 'The core engine ships with zero dependencies and only peers on React itself — no lodash, no date-fns, no style libraries. One npm install, one tree-shakable package, nothing extra in your bundle.',
  },
  {
    icon: '▦',
    title: 'Cell-first architecture',
    desc: 'Compose Grid.Header / Body / Row / Cell. Cells read row data from React context, so wrapper divs never break your layout.',
  },
  {
    icon: '⚙',
    title: 'Plugin pipeline',
    desc: 'Sort → filter → paginate runs as a composable pipeline. Bring the plugins you need, skip the ones you don’t.',
  },
  {
    icon: '◎',
    title: 'Headless by default',
    desc: 'Zero built-in styles. Every interaction is a hook. Render anything — HTML tables, divs, cards, lists.',
  },
  {
    icon: '◐',
    title: 'CSS-variable theming',
    desc: 'Theme the whole grid by overriding a handful of --lattice-* custom properties. Light / dark / brand in minutes.',
  },
  {
    icon: '⟶',
    title: 'Column superpowers',
    desc: 'Hide, resize, reorder, and freeze columns at runtime — all driven by state, not DOM hacks.',
  },
]

export function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-label">Why Lattice</div>
        <h2 className="section-title">A grid that gets out of your way</h2>
        <p className="section-desc">
          Lattice is built for teams who are tired of fighting opinionated grid libraries — and tired of npm-installing
          a dependency tree the size of the product itself. You keep full control of the markup, the styling, and the
          interaction model. Lattice just handles the state machine behind it — with zero third-party runtime dependencies.
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
