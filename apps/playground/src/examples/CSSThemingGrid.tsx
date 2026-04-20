import React, { useState } from 'react'
import { Grid, Row, Cell } from '@reactzero/lattice/react/components'
import { usePlugin } from '@reactzero/lattice/react/hooks'
import { sortPlugin, type SortPluginAPI } from '@reactzero/lattice/sort'
import { employees, type Employee } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ThemeVars = {
  '--lattice-brand': string
  '--lattice-brand-light': string
  '--lattice-bg': string
  '--lattice-surface': string
  '--lattice-text': string
  '--lattice-text-muted': string
  '--lattice-border': string
  '--lattice-hover': string
  '--lattice-selected': string
}

const themes: Record<string, ThemeVars> = {
  default: {
    '--lattice-brand': '#6366f1',
    '--lattice-brand-light': '#818cf8',
    '--lattice-bg': '#ffffff',
    '--lattice-surface': '#f9fafb',
    '--lattice-text': '#1f2937',
    '--lattice-text-muted': '#6b7280',
    '--lattice-border': '#e5e7eb',
    '--lattice-hover': '#f3f4f6',
    '--lattice-selected': '#eef2ff',
  },
  dark: {
    '--lattice-brand': '#a78bfa',
    '--lattice-brand-light': '#c4b5fd',
    '--lattice-bg': '#1e1e2e',
    '--lattice-surface': '#181825',
    '--lattice-text': '#cdd6f4',
    '--lattice-text-muted': '#a6adc8',
    '--lattice-border': '#313244',
    '--lattice-hover': '#2a2a3c',
    '--lattice-selected': '#2e2b4a',
  },
  warm: {
    '--lattice-brand': '#d97706',
    '--lattice-brand-light': '#f59e0b',
    '--lattice-bg': '#fffbf0',
    '--lattice-surface': '#fef7e8',
    '--lattice-text': '#451a03',
    '--lattice-text-muted': '#92400e',
    '--lattice-border': '#fde68a',
    '--lattice-hover': '#fef3c7',
    '--lattice-selected': '#fef9c3',
  },
  ocean: {
    '--lattice-brand': '#0891b2',
    '--lattice-brand-light': '#22d3ee',
    '--lattice-bg': '#f0fdfa',
    '--lattice-surface': '#e6fffa',
    '--lattice-text': '#134e4a',
    '--lattice-text-muted': '#5eead4',
    '--lattice-border': '#99f6e4',
    '--lattice-hover': '#ccfbf1',
    '--lattice-selected': '#d5f5f6',
  },
}

const editableVars: { key: keyof ThemeVars; label: string }[] = [
  { key: '--lattice-brand', label: 'Brand' },
  { key: '--lattice-bg', label: 'Background' },
  { key: '--lattice-surface', label: 'Surface' },
  { key: '--lattice-text', label: 'Text' },
  { key: '--lattice-border', label: 'Border' },
  { key: '--lattice-hover', label: 'Hover' },
]

function SortableHeader({ columnKey, label }: { columnKey: string; label: string }) {
  const sortApi = usePlugin<SortPluginAPI<Employee>>('sort')
  const dir = sortApi.isSorted(columnKey as keyof Employee & string)
  return (
    <div className="cell sortable-cell" onClick={() => sortApi.toggleSort(columnKey as keyof Employee & string)}>
      {label}
      <span className="sort-indicator">
        {dir === 'asc' ? '\u25B2' : dir === 'desc' ? '\u25BC' : '\u25C6'}
      </span>
    </div>
  )
}

function generateCSSCode(vars: ThemeVars): string {
  const lines = ['.my-custom-grid {']
  for (const [key, value] of Object.entries(vars)) {
    lines.push(`  ${key}: ${value};`)
  }
  lines.push('}')
  return lines.join('\n')
}

const staticCode = `// Lattice grids are styled via CSS custom properties.
// Override them on any container to theme the grid.

// 1. Preset themes — just swap the class
<div style={themeVars}>
  <Grid data={employees} rowKey="id" plugins={[sortPlugin()]}>
    ...
  </Grid>
</div>

// 2. Or set variables in plain CSS:
.my-grid-wrapper {
  --lattice-brand: #d97706;
  --lattice-bg: #fffbf0;
  --lattice-text: #451a03;
  --lattice-border: #fde68a;
}

// All components (sort indicators, badges, hover states)
// automatically pick up the new values.`

export function CSSThemingGrid() {
  const [vars, setVars] = useState<ThemeVars>({ ...themes.default })
  const [activePreset, setActivePreset] = useState('default')

  const applyPreset = (name: string) => {
    setVars({ ...themes[name] })
    setActivePreset(name)
  }

  const updateVar = (key: keyof ThemeVars, value: string) => {
    setVars(prev => ({ ...prev, [key]: value }))
    setActivePreset('')
  }

  const sort = React.useMemo(() => sortPlugin<Employee>(), [])

  return (
    <ExampleSection
      id="css-theming"
      title="CSS Theming"
      description="Lattice is styled entirely with CSS custom properties. Switch presets or edit individual variables — the grid updates instantly with zero JS changes."
      code={staticCode}
    >
      {/* Preset buttons */}
      <div className="theme-presets">
        {Object.keys(themes).map(name => (
          <button
            key={name}
            className={`theme-preset-btn ${activePreset === name ? 'active' : ''}`}
            onClick={() => applyPreset(name)}
            style={{
              '--preview-brand': themes[name]['--lattice-brand'],
              '--preview-bg': themes[name]['--lattice-bg'],
            } as React.CSSProperties}
          >
            <span className="preset-swatch" />
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>

      {/* Variable editor */}
      <div className="theme-editor">
        {editableVars.map(({ key, label }) => (
          <div key={key} className="theme-var-row">
            <label>{label}</label>
            <input
              type="color"
              value={vars[key]}
              onChange={e => updateVar(key, e.target.value)}
            />
            <input
              type="text"
              value={vars[key]}
              onChange={e => updateVar(key, e.target.value)}
              className="theme-var-text"
            />
          </div>
        ))}
      </div>

      {/* Themed grid */}
      <div style={vars as React.CSSProperties}>
        <Grid data={employees.slice(0, 8)} rowKey="id" plugins={[sort]} aria-label="Themed grid">
          <Grid.Header>
            <div className="grid-row grid-cols-5 header-row">
              <SortableHeader columnKey="name" label="Name" />
              <SortableHeader columnKey="department" label="Department" />
              <SortableHeader columnKey="role" label="Role" />
              <SortableHeader columnKey="salary" label="Salary" />
              <div className="cell">Status</div>
            </div>
          </Grid.Header>
          <Grid.Body>
            <Row>
              <div className="grid-row grid-cols-5">
                <Cell columnKey="name" />
                <Cell columnKey="department" />
                <Cell columnKey="role" />
                <Cell<Employee> columnKey="salary" render={(v) => (
                  <span>${Number(v).toLocaleString()}</span>
                )} />
                <Cell columnKey="status" render={(v) => (
                  <span className={`status-badge status-${v}`}>{String(v)}</span>
                )} />
              </div>
            </Row>
          </Grid.Body>
        </Grid>
      </div>

      {/* CSS output */}
      <div className="theme-css-output">
        <strong>Generated CSS:</strong>
        <pre className="code-pre">{generateCSSCode(vars)}</pre>
      </div>
    </ExampleSection>
  )
}
