export function ArchitectureSection() {
  return (
    <section className="section" id="architecture">
      <div className="container">
        <div className="section-label">Architecture</div>
        <h2 className="section-title">Data flows through a predictable pipeline</h2>
        <p className="section-desc">
          Every state update runs your raw data through the plugin pipeline in a fixed order. Plugins tap into the
          same reducer, so their effects compose cleanly — sort before filter before paginate, always.
        </p>
        <div className="pipeline">
          <div className="pipeline-step">rawRows</div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step accent">sort()</div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step accent">filter()</div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step accent">paginate()</div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">rows</div>
        </div>
      </div>
    </section>
  )
}
