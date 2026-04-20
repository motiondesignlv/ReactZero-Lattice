import { useState } from 'react'
import { HeroShowcase } from './hero/HeroShowcase'

export function Hero() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install reactzero-lattice')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <header className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            v0.1.0 · zero dependencies · cell-first
          </div>
          <h1 className="hero-title">
            The zero-dependency <span>data grid</span> for React
          </h1>
          <p className="hero-tagline">
            A headless grid engine you compose with{' '}
            <code>{'<Grid.Header>'}</code>, <code>{'<Grid.Body>'}</code>,{' '}
            <code>{'<Grid.Row>'}</code>, and <code>{'<Grid.Cell>'}</code>. Bolt on sort, filter, and pagination plugins. Style it with CSS variables.{' '}
            <strong>No third-party runtime dependencies. Just React.</strong>
          </p>
          <div className="hero-install">
            <span className="dollar">$</span>
            <code>npm install reactzero-lattice</code>
            <button className="copy" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="hero-ctas">
            <a className="btn-primary" href="#quickstart">
              Get started →
            </a>
            <a className="btn-secondary" href="#playground">
              Try it live
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">0</div>
              <div className="hero-stat-label">Runtime deps</div>
            </div>
            <div>
              <div className="hero-stat-value">1</div>
              <div className="hero-stat-label">npm install</div>
            </div>
            <div>
              <div className="hero-stat-value">16+</div>
              <div className="hero-stat-label">Live demos</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="demo-shell">
            <HeroShowcase />
          </div>
        </div>
      </div>
    </header>
  )
}
