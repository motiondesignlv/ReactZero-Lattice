export function FooterSection() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">lattice</div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#quickstart">Quick start</a>
            <a href="#playground">Playground</a>
            <a href="https://github.com/motiondesignlv/ReactZero-Lattice" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/reactzero-lattice" target="_blank" rel="noreferrer">
              npm
            </a>
          </div>
        </div>
        <div className="footer-copy">
          MIT License · Built by{' '}
          <a href="https://github.com/motiondesignlv" target="_blank" rel="noreferrer">
            motiondesignlv
          </a>
        </div>
      </div>
    </footer>
  )
}
