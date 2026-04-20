import { useMemo, useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin } from '@reactzero/lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { employees, type Employee } from '../data/sampleData'
import { CodeBlock } from '../components/CodeBlock'

type ThemeKey =
  | 'minimal'
  | 'terminal'
  | 'neobrutal'
  | 'glass'
  | 'editorial'
  | 'synthwave'
  | 'pastel'
  | 'blueprint'
  | 'random'

const themes: { key: ThemeKey; label: string; blurb: string }[] = [
  { key: 'minimal', label: 'Minimal', blurb: 'Whitespace, subtle lines, quiet type.' },
  { key: 'terminal', label: 'Terminal', blurb: 'Green-on-black monospace CLI aesthetic.' },
  { key: 'neobrutal', label: 'Neo-brutal', blurb: 'Thick black borders, offset shadow.' },
  { key: 'glass', label: 'Glass', blurb: 'Frosted translucency on a color gradient.' },
  { key: 'editorial', label: 'Editorial', blurb: 'Serif display, column rules, print-magazine feel.' },
  { key: 'synthwave', label: 'Synthwave', blurb: 'Neon magenta & cyan on deep purple, glowing.' },
  { key: 'pastel', label: 'Pastel', blurb: 'Soft pink & lavender, rounded, pillowy shadows.' },
  { key: 'blueprint', label: 'Blueprint', blurb: 'Drafting-table blue with dashed grid lines.' },
  { key: 'random', label: 'Randomize', blurb: 'A new design every click — palette, spacing, shape.' },
]

const themeCss: Record<Exclude<ThemeKey, 'random'>, string> = {
  minimal: `/* theme-minimal.css — quiet, lots of whitespace */
.theme-minimal {
  --lattice-bg: #ffffff;
  --lattice-border: #ececec;
  --lattice-text: #18181b;
  --lattice-text-muted: #71717a;
  --lattice-hover: #fafafa;
}
.theme-minimal [data-lattice-grid] {
  border: none;
  border-radius: 0;
  box-shadow: none;
}
.theme-minimal .header-row {
  background: transparent;
  border-bottom: 1px solid #ececec;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  color: #71717a;
}
.theme-minimal [data-lattice-row] {
  border-bottom: 1px solid #f4f4f5;
}
.theme-minimal .status-badge {
  background: none !important;
  color: currentColor !important;
  border: 1px solid currentColor;
  opacity: 0.7;
  font-weight: 400;
}`,

  terminal: `/* theme-terminal.css — a CLI in table form */
.theme-terminal {
  --lattice-bg: #0a0f0a;
  --lattice-surface: #0f1a0f;
  --lattice-border: #1a3a1a;
  --lattice-text: #00ff88;
  --lattice-text-muted: #4ade80;
  --lattice-hover: #0d1f0d;
}
.theme-terminal [data-lattice-grid] {
  font-family: 'JetBrains Mono', monospace !important;
  border: 1px solid #1a3a1a;
  border-radius: 0;
  box-shadow:
    0 0 0 1px rgba(0, 255, 136, 0.15),
    inset 0 0 80px rgba(0, 255, 136, 0.05);
}
.theme-terminal .header-row {
  background: #0f1a0f;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.68rem;
  border-bottom: 1px solid #1a3a1a;
}
.theme-terminal [data-lattice-cell] {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.theme-terminal .sortable-cell:hover {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}
.theme-terminal .status-badge {
  background: transparent !important;
  border: 1px solid #00ff88 !important;
  color: #00ff88 !important;
  border-radius: 0;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,

  neobrutal: `/* theme-neobrutal.css — no grays, no gradients, all attitude */
.theme-neobrutal {
  --lattice-bg: #fff9e6;
  --lattice-surface: #fef3c7;
  --lattice-border: #000000;
  --lattice-text: #000000;
  --lattice-text-muted: #000000;
  --lattice-hover: #fde68a;
}
.theme-neobrutal [data-lattice-grid] {
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 8px 8px 0 0 #000;
}
.theme-neobrutal .header-row {
  background: #000;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  border-bottom: 3px solid #000;
}
.theme-neobrutal .header-row .cell,
.theme-neobrutal .sortable-cell {
  color: #fff9e6 !important;
}
.theme-neobrutal [data-lattice-row] {
  border-bottom: 2px solid #000;
}
.theme-neobrutal [data-lattice-cell] { font-weight: 600; }
.theme-neobrutal [data-lattice-row]:hover { background: #fde68a; }
.theme-neobrutal .status-badge {
  border: 2px solid #000 !important;
  border-radius: 0;
  box-shadow: 2px 2px 0 0 #000;
  font-weight: 700;
}`,

  glass: `/* theme-glass.css — frosted glass on a color gradient */
.theme-glass {
  background: linear-gradient(135deg, #c7d2fe 0%, #fbcfe8 50%, #a5f3fc 100%);
  padding: 28px;
  border-radius: 20px;
  --lattice-bg: rgba(255, 255, 255, 0.55);
  --lattice-border: rgba(255, 255, 255, 0.4);
  --lattice-text: #1e293b;
  --lattice-text-muted: #475569;
  --lattice-hover: rgba(255, 255, 255, 0.75);
}
.theme-glass [data-lattice-grid] {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(51, 65, 85, 0.18);
}
.theme-glass .header-row {
  background: rgba(255, 255, 255, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  color: #334155;
}
.theme-glass [data-lattice-row]:hover {
  background: rgba(255, 255, 255, 0.75);
}
.theme-glass .status-badge {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}`,

  editorial: `/* theme-editorial.css — serif display, print-magazine bones */
.theme-editorial {
  --lattice-bg: #faf7f0;
  --lattice-surface: #f5efe0;
  --lattice-border: #d4c5a0;
  --lattice-text: #1c1917;
  --lattice-text-muted: #78716c;
  --lattice-hover: #f0e8d4;
}
.theme-editorial [data-lattice-grid] {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  background: #faf7f0;
  border: none;
  border-top: 3px double #1c1917;
  border-bottom: 3px double #1c1917;
  border-radius: 0;
  box-shadow: none;
}
.theme-editorial .header-row {
  background: transparent;
  border-bottom: 1px solid #1c1917;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.68rem;
  font-weight: 700;
  font-family: Georgia, serif;
  color: #1c1917;
}
.theme-editorial [data-lattice-cell] {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}
.theme-editorial [data-lattice-row] {
  border-bottom: 1px solid #e7dfc7;
}
.theme-editorial [data-lattice-row]:hover {
  background: #f0e8d4;
}
.theme-editorial .status-badge {
  background: transparent !important;
  border: none !important;
  color: #b91c1c !important;
  font-style: italic;
  font-family: Georgia, serif;
  text-transform: lowercase;
  letter-spacing: 0.02em;
  font-weight: 600;
  padding: 0 !important;
}`,

  synthwave: `/* theme-synthwave.css — neon grid on deep purple */
.theme-synthwave {
  --lattice-bg: #1a0b2e;
  --lattice-surface: #2d1b4e;
  --lattice-border: #ff0080;
  --lattice-text: #ff71ce;
  --lattice-text-muted: #01cdfe;
  --lattice-hover: rgba(255, 0, 128, 0.12);
}
.theme-synthwave [data-lattice-grid] {
  background: linear-gradient(180deg, #1a0b2e 0%, #2d1b4e 100%);
  border: 1px solid #ff0080;
  border-radius: 4px;
  box-shadow:
    0 0 24px rgba(255, 0, 128, 0.35),
    inset 0 0 60px rgba(1, 205, 254, 0.08);
}
.theme-synthwave .header-row {
  background: rgba(255, 0, 128, 0.15);
  color: #00f0ff;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.72rem;
  text-shadow: 0 0 8px #00f0ff;
  border-bottom: 1px solid #ff0080;
}
.theme-synthwave [data-lattice-cell] {
  color: #ff71ce;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}
.theme-synthwave [data-lattice-row] {
  border-bottom: 1px solid rgba(255, 0, 128, 0.2);
}
.theme-synthwave [data-lattice-row]:hover {
  background: rgba(255, 0, 128, 0.1);
}
.theme-synthwave .sortable-cell:hover {
  color: #00f0ff;
  text-shadow: 0 0 10px #00f0ff;
}
.theme-synthwave .status-badge {
  background: rgba(1, 205, 254, 0.12) !important;
  border: 1px solid #00f0ff !important;
  color: #00f0ff !important;
  border-radius: 2px;
  text-shadow: 0 0 6px #00f0ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.65rem;
  font-family: 'JetBrains Mono', monospace;
}`,

  pastel: `/* theme-pastel.css — soft, rounded, pillowy */
.theme-pastel {
  --lattice-bg: #fef3f5;
  --lattice-surface: #fce7f3;
  --lattice-border: #fbcfe8;
  --lattice-text: #831843;
  --lattice-text-muted: #be185d;
  --lattice-hover: #fce7f3;
}
.theme-pastel [data-lattice-grid] {
  background: #fef3f5;
  border: 1px solid #fbcfe8;
  border-radius: 16px;
  box-shadow: 0 22px 44px -20px rgba(219, 39, 119, 0.3);
  overflow: hidden;
}
.theme-pastel .header-row {
  background: #fce7f3;
  color: #9f1239;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.78rem;
  border-bottom: 1px solid #fbcfe8;
}
.theme-pastel [data-lattice-row] {
  border-bottom: 1px solid rgba(251, 207, 232, 0.5);
}
.theme-pastel [data-lattice-row]:hover {
  background: #fce7f3;
}
.theme-pastel .status-badge {
  background: #c4b5fd !important;
  color: #4c1d95 !important;
  border: none !important;
  border-radius: 999px;
  padding: 3px 12px;
  font-weight: 500;
  box-shadow: 0 4px 10px -4px rgba(139, 92, 246, 0.4);
}`,

  blueprint: `/* theme-blueprint.css — drafting table, dashed grid */
.theme-blueprint {
  --lattice-bg: #1e3a8a;
  --lattice-surface: rgba(0, 0, 0, 0.15);
  --lattice-border: rgba(255, 255, 255, 0.25);
  --lattice-text: #eff6ff;
  --lattice-text-muted: #93c5fd;
  --lattice-hover: rgba(255, 255, 255, 0.06);
}
.theme-blueprint [data-lattice-grid] {
  background-color: #1e3a8a;
  background-image:
    repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,0.05) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.05) 23px 24px);
  border: 1px dashed rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
.theme-blueprint .header-row {
  background: rgba(0, 0, 0, 0.2);
  color: #dbeafe;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.68rem;
  font-family: 'JetBrains Mono', monospace;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
}
.theme-blueprint [data-lattice-cell] {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.theme-blueprint [data-lattice-row] {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
}
.theme-blueprint [data-lattice-row]:hover {
  background: rgba(255, 255, 255, 0.06);
}
.theme-blueprint .status-badge {
  background: transparent !important;
  border: 1px solid #93c5fd !important;
  color: #93c5fd !important;
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.65rem;
}`,
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function generateRandomTheme(): string {
  const isDark = Math.random() > 0.5
  const hue = Math.floor(Math.random() * 360)
  const accentHue = Math.floor((hue + 90 + Math.random() * 180) % 360)
  const radius = pick([0, 2, 6, 12, 20] as const)
  const borderWeight = pick([1, 2, 3] as const)
  const padding = pick([6, 10, 14, 20] as const)
  const shadow = pick(['none', 'soft', 'offset', 'glow'] as const)
  const font = pick(['system', 'serif', 'mono'] as const)

  const p = isDark
    ? {
        bg: `hsl(${hue}, 30%, 10%)`,
        surface: `hsl(${hue}, 35%, 16%)`,
        text: `hsl(${accentHue}, 70%, 92%)`,
        muted: `hsl(${accentHue}, 40%, 68%)`,
        border: `hsl(${hue}, 30%, 28%)`,
        hover: `hsl(${hue}, 35%, 19%)`,
        accent: `hsl(${accentHue}, 75%, 65%)`,
        onAccent: `hsl(${hue}, 30%, 10%)`,
      }
    : {
        bg: `hsl(${hue}, 25%, 97%)`,
        surface: `hsl(${hue}, 30%, 92%)`,
        text: `hsl(${hue}, 50%, 15%)`,
        muted: `hsl(${hue}, 20%, 45%)`,
        border: `hsl(${hue}, 30%, 82%)`,
        hover: `hsl(${hue}, 30%, 94%)`,
        accent: `hsl(${accentHue}, 70%, 45%)`,
        onAccent: '#ffffff',
      }

  const shadowRule = {
    none: 'none',
    soft: `0 14px 32px -16px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.25)'}`,
    offset: `${borderWeight * 2}px ${borderWeight * 2}px 0 0 ${p.text}`,
    glow: `0 0 24px hsla(${accentHue}, 75%, 60%, 0.45)`,
  }[shadow]

  const fontFamily = {
    system: `-apple-system, system-ui, 'Segoe UI', sans-serif`,
    serif: `'Playfair Display', Georgia, serif`,
    mono: `'JetBrains Mono', 'Fira Code', monospace`,
  }[font]

  const stamp = new Date().toISOString().slice(11, 19)
  return `/* theme-random.css — generated ${stamp} · mode: ${isDark ? 'dark' : 'light'} */
.theme-random {
  --lattice-bg: ${p.bg};
  --lattice-surface: ${p.surface};
  --lattice-border: ${p.border};
  --lattice-text: ${p.text};
  --lattice-text-muted: ${p.muted};
  --lattice-hover: ${p.hover};
}
.theme-random [data-lattice-grid] {
  font-family: ${fontFamily};
  background: ${p.bg};
  border: ${borderWeight}px solid ${p.border};
  border-radius: ${radius}px;
  box-shadow: ${shadowRule};
}
.theme-random .header-row {
  background: ${p.surface};
  color: ${p.accent};
  border-bottom: ${borderWeight}px solid ${p.border};
  font-weight: 600;
  letter-spacing: 0.04em;
}
.theme-random [data-lattice-cell] {
  padding: ${padding}px 14px;
}
.theme-random [data-lattice-row] {
  border-bottom: 1px solid ${p.border};
}
.theme-random [data-lattice-row]:hover {
  background: ${p.hover};
}
.theme-random .status-badge {
  background: ${p.accent} !important;
  color: ${p.onAccent} !important;
  border: ${borderWeight}px solid ${p.accent} !important;
  border-radius: ${Math.max(radius - 2, 0)}px;
  font-weight: 600;
  letter-spacing: 0.03em;
}`
}

function SortableHeader({ columnKey, label }: { columnKey: keyof Employee & string; label: string }) {
  const sort = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sort.isSorted(columnKey)
  return (
    <div className="cell sortable-cell" onClick={() => sort.toggleSort(columnKey)}>
      {label}
      <span className="sort-indicator">{dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ' ↕'}</span>
    </div>
  )
}

export function ThemingSection() {
  const [theme, setTheme] = useState<ThemeKey>('minimal')
  const [randomCss, setRandomCss] = useState<string>(() => generateRandomTheme())
  const plugins = useMemo(() => [sortPlugin<Employee>({ multiSort: true })], [])

  const handlePick = (key: ThemeKey) => {
    setTheme(key)
    if (key === 'random') setRandomCss(generateRandomTheme())
  }

  const activeCss = theme === 'random' ? randomCss : themeCss[theme]

  return (
    <section className="section" id="theming">
      <div className="container">
        <div className="section-label">Theming · Zero dependencies · Headless</div>
        <h2 className="section-title">The same component, nine completely different tables</h2>
        <p className="section-desc">
          Lattice ships <strong>no visual CSS at all</strong>. The engine in <code>@reactzero/lattice/core</code> has
          zero runtime dependencies and zero styles — it just emits <code>data-lattice-*</code> attributes and
          composable primitives. Everything below renders from identical JSX and the same sort plugin. The
          only thing that changes when you click a theme is a CSS class on the wrapper. Hit{' '}
          <strong>Randomize</strong> to watch real CSS get generated live.
        </p>

        <div className="theming-picker">
          {themes.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`theming-pick ${theme === t.key ? 'active' : ''}`}
              onClick={() => handlePick(t.key)}
            >
              <span className={`theming-swatch swatch-${t.key}`} />
              <span className="theming-pick-body">
                <strong>{t.label}</strong>
                <span>{t.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="theming-layout">
          <div className={`theming-stage theme-${theme}`}>
            {theme === 'random' && <style>{randomCss}</style>}
            <div className="table-scroll">
              <Grid data={employees.slice(0, 8)} rowKey="id" plugins={plugins} aria-label="Themed grid">
                <Grid.Header>
                  <div className="grid-row grid-cols-4 header-row">
                    <SortableHeader columnKey="name" label="Name" />
                    <SortableHeader columnKey="department" label="Department" />
                    <SortableHeader columnKey="role" label="Role" />
                    <SortableHeader columnKey="status" label="Status" />
                  </div>
                </Grid.Header>
                <Grid.Body>
                  <Row>
                    <div className="grid-row grid-cols-4">
                      <Cell columnKey="name" />
                      <Cell columnKey="department" />
                      <Cell columnKey="role" />
                      <Cell
                        columnKey="status"
                        render={(v) => (
                          <span className={`status-badge status-${v}`}>{String(v)}</span>
                        )}
                      />
                    </div>
                  </Row>
                </Grid.Body>
              </Grid>
            </div>
          </div>

          <div className="theming-code">
            <div className="theming-code-head">
              <span className="theming-code-file">theme-{theme}.css</span>
              {theme === 'random' ? (
                <button
                  type="button"
                  className="theming-reroll"
                  onClick={() => setRandomCss(generateRandomTheme())}
                >
                  ↻ Re-roll
                </button>
              ) : (
                <span className="theming-code-hint">Live CSS for the active theme ↓</span>
              )}
            </div>
            <CodeBlock code={activeCss} language="css" />
          </div>
        </div>
      </div>
    </section>
  )
}
