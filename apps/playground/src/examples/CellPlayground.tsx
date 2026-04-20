import React, { useState, useMemo } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { products, type Product } from '../data'
import { ExampleSection } from '../components/ExampleSection'

type ContentType = 'text' | 'multiline' | 'image' | 'avatar'
type Accessory = 'none' | 'badge' | 'progress' | 'stars'
type Actions = 'none' | 'single' | 'group'
type Alignment = 'left' | 'center' | 'right'
type Density = 'compact' | 'normal' | 'spacious'

type CellConfig = {
  contentType: ContentType
  accessory: Accessory
  actions: Actions
  showLink: boolean
  alignment: Alignment
  density: Density
  truncate: boolean
}

const maxPrice = Math.max(...products.map(p => p.price))

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= Math.round(rating) ? 'star-filled' : 'star-empty'}>
          {star <= Math.round(rating) ? '\u2605' : '\u2606'}
        </span>
      ))}
      <span className="star-value">{rating.toFixed(1)}</span>
    </span>
  )
}

function generateCode(config: CellConfig): string {
  const lines: string[] = ['<Grid data={products} rowKey="id">']
  lines.push('  <Grid.Body>')
  lines.push('    <Row>')
  lines.push(`      <div className="grid-row" style={{ textAlign: "${config.alignment}" }}>`)

  // Product column
  if (config.contentType === 'text') {
    lines.push('        <Cell columnKey="name" />')
  } else if (config.contentType === 'multiline') {
    lines.push('        <Cell columnKey="name" render={(_v, ctx) => (')
    lines.push('          <div className="cell-multiline">')
    lines.push('            <span className="cell-title">{ctx.row.name}</span>')
    lines.push('            <span className="cell-subtitle">SKU: {ctx.row.sku}</span>')
    lines.push('          </div>')
    lines.push('        )} />')
  } else if (config.contentType === 'image') {
    lines.push('        <Cell columnKey="name" render={(_v, ctx) => (')
    lines.push('          <div className="cell-with-avatar">')
    lines.push('            <img className="avatar-img" src={ctx.row.image} />')
    lines.push('            <div className="cell-multiline">')
    lines.push('              <span className="cell-title">{ctx.row.name}</span>')
    lines.push('              <span className="cell-subtitle">{ctx.row.category}</span>')
    lines.push('            </div>')
    lines.push('          </div>')
    lines.push('        )} />')
  } else {
    lines.push('        <Cell columnKey="name" render={(_v, ctx) => (')
    lines.push('          <div className="cell-with-avatar">')
    lines.push('            <div className="avatar">{ctx.row.name[0]}</div>')
    lines.push('            <span>{ctx.row.name}</span>')
    lines.push('          </div>')
    lines.push('        )} />')
  }

  lines.push('        <Cell columnKey="category" />')

  // Price column
  if (config.accessory === 'none') {
    lines.push('        <Cell columnKey="price" render={(v) => `$${Number(v).toFixed(2)}`} />')
  } else if (config.accessory === 'badge') {
    lines.push('        <Cell columnKey="price" render={(v) => (')
    lines.push('          <span className="price-badge">${Number(v).toFixed(2)}</span>')
    lines.push('        )} />')
  } else if (config.accessory === 'progress') {
    lines.push('        <Cell columnKey="price" render={(v) => (')
    lines.push('          <div className="salary-bar">...</div>')
    lines.push('        )} />')
  } else {
    lines.push('        <Cell columnKey="rating" render={(v) => (')
    lines.push('          <StarRating rating={v} />')
    lines.push('        )} />')
  }

  lines.push('        <Cell columnKey="inStock" render={(v) => (')
  lines.push('          <span className={`stock-badge stock-${v ? "yes" : "no"}`}>')
  lines.push('            {v ? "In Stock" : "Out of Stock"}')
  lines.push('          </span>')
  lines.push('        )} />')

  if (config.actions === 'single') {
    lines.push('        <Cell render={(_v, ctx) => (')
    lines.push('          <button className="action-btn action-btn-view">Details</button>')
    lines.push('        )} />')
  } else if (config.actions === 'group') {
    lines.push('        <Cell render={(_v, ctx) => (')
    lines.push('          <div className="cell-actions">')
    lines.push('            <button className="action-btn action-btn-view">View</button>')
    lines.push('            <button className="action-btn action-btn-edit">Edit</button>')
    lines.push('            <button className="action-btn action-btn-danger">Del</button>')
    lines.push('          </div>')
    lines.push('        )} />')
  }

  if (config.showLink) {
    lines.push('        <Cell columnKey="sku" render={(v) => (')
    lines.push('          <a className="cell-link" href="#">{v}</a>')
    lines.push('        )} />')
  }

  lines.push('      </div>')
  lines.push('    </Row>')
  lines.push('  </Grid.Body>')
  lines.push('</Grid>')
  return lines.join('\n')
}

function RadioGroup<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="control-group">
      <span className="control-label">{label}</span>
      <div className="control-options">
        {options.map(opt => (
          <label key={opt.value} className="control-option">
            <input type="radio" name={label} checked={value === opt.value} onChange={() => onChange(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function CellPlayground() {
  const [config, setConfig] = useState<CellConfig>({
    contentType: 'image',
    accessory: 'progress',
    actions: 'group',
    showLink: true,
    alignment: 'left',
    density: 'normal',
    truncate: false,
  })

  const update = <K extends keyof CellConfig>(key: K, value: CellConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const colCount = useMemo(() => {
    let count = 4 // product, category, price/rating, stock
    if (config.actions !== 'none') count++
    if (config.showLink) count++
    return count
  }, [config.actions, config.showLink])

  const densityPadding = config.density === 'compact' ? '0.375rem 0.625rem' : config.density === 'spacious' ? '1rem 1.25rem' : undefined

  const code = generateCode(config)

  return (
    <ExampleSection
      id="cell-playground"
      title="Cell Lab"
      description="Interactively configure cell content, accessories, actions, and layout. The grid updates live as you toggle options. Check the generated code below."
      code={code}
    >
      <div className="cell-playground-controls">
        <RadioGroup label="Content" value={config.contentType} onChange={v => update('contentType', v)} options={[
          { value: 'text', label: 'Text Only' },
          { value: 'multiline', label: 'Multi-line' },
          { value: 'image', label: 'With Image' },
          { value: 'avatar', label: 'Avatar Initials' },
        ]} />
        <RadioGroup label="Price Display" value={config.accessory} onChange={v => update('accessory', v)} options={[
          { value: 'none', label: 'Plain' },
          { value: 'badge', label: 'Badge' },
          { value: 'progress', label: 'Progress Bar' },
          { value: 'stars', label: 'Star Rating' },
        ]} />
        <RadioGroup label="Actions" value={config.actions} onChange={v => update('actions', v)} options={[
          { value: 'none', label: 'None' },
          { value: 'single', label: 'Single Button' },
          { value: 'group', label: 'Button Group' },
        ]} />
        <RadioGroup label="Alignment" value={config.alignment} onChange={v => update('alignment', v)} options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]} />
        <RadioGroup label="Density" value={config.density} onChange={v => update('density', v)} options={[
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'spacious', label: 'Spacious' },
        ]} />
        <div className="control-group">
          <span className="control-label">Options</span>
          <div className="control-options">
            <label className="control-option">
              <input type="checkbox" checked={config.showLink} onChange={e => update('showLink', e.target.checked)} />
              Show Link Column
            </label>
            <label className="control-option">
              <input type="checkbox" checked={config.truncate} onChange={e => update('truncate', e.target.checked)} />
              Truncate Text
            </label>
          </div>
        </div>
      </div>

      <Grid data={products} rowKey="id" aria-label="Cell playground grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, textAlign: config.alignment }}>
            <div className="cell">Product</div>
            <div className="cell">Category</div>
            <div className="cell">{config.accessory === 'stars' ? 'Rating' : 'Price'}</div>
            <div className="cell">Stock</div>
            {config.actions !== 'none' && <div className="cell">Actions</div>}
            {config.showLink && <div className="cell">Link</div>}
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, textAlign: config.alignment }}>
              {/* Product — content type driven */}
              {config.contentType === 'text' && (
                <Cell<Product> columnKey="name" style={densityPadding ? { padding: densityPadding } : undefined}
                  className={config.truncate ? 'cell-truncate' : undefined}
                />
              )}
              {config.contentType === 'multiline' && (
                <Cell<Product> columnKey="name" style={densityPadding ? { padding: densityPadding } : undefined} render={(_v, ctx) => (
                  <div className="cell-multiline">
                    <span className="cell-title">{ctx.row.name}</span>
                    <span className="cell-subtitle">SKU: {ctx.row.sku}</span>
                  </div>
                )} />
              )}
              {config.contentType === 'image' && (
                <Cell<Product> columnKey="name" style={densityPadding ? { padding: densityPadding } : undefined} render={(_v, ctx) => (
                  <div className="cell-with-avatar">
                    <img className="avatar-img" src={ctx.row.image} alt={ctx.row.name} />
                    <div className="cell-multiline">
                      <span className="cell-title">{ctx.row.name}</span>
                      <span className="cell-subtitle">{ctx.row.category}</span>
                    </div>
                  </div>
                )} />
              )}
              {config.contentType === 'avatar' && (
                <Cell<Product> columnKey="name" style={densityPadding ? { padding: densityPadding } : undefined} render={(_v, ctx) => (
                  <div className="cell-with-avatar">
                    <div className="avatar">{ctx.row.name[0]}</div>
                    <span className={config.truncate ? 'cell-truncate' : undefined}>{ctx.row.name}</span>
                  </div>
                )} />
              )}

              {/* Category */}
              <Cell<Product> columnKey="category"
                style={densityPadding ? { padding: densityPadding } : undefined}
                className={config.truncate ? 'cell-truncate' : undefined}
              />

              {/* Price / Rating — accessory driven */}
              {config.accessory === 'none' && (
                <Cell<Product> columnKey="price" style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(v) => <span>${Number(v).toFixed(2)}</span>} />
              )}
              {config.accessory === 'badge' && (
                <Cell<Product> columnKey="price" style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(v) => <span className="price-badge">${Number(v).toFixed(2)}</span>} />
              )}
              {config.accessory === 'progress' && (
                <Cell<Product> columnKey="price" style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(v) => (
                    <div className="salary-bar">
                      <div className="salary-bar-track">
                        <div className="salary-bar-fill" style={{ width: `${(Number(v) / maxPrice) * 100}%` }} />
                      </div>
                      <span className="salary-amount">${Number(v).toFixed(2)}</span>
                    </div>
                  )} />
              )}
              {config.accessory === 'stars' && (
                <Cell<Product> columnKey="rating" style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(v) => <StarRating rating={Number(v)} />} />
              )}

              {/* Stock badge */}
              <Cell<Product> columnKey="inStock" style={densityPadding ? { padding: densityPadding } : undefined}
                render={(v) => (
                  <span className={`stock-badge stock-${v ? 'yes' : 'no'}`}>
                    {v ? 'In Stock' : 'Out of Stock'}
                  </span>
                )} />

              {/* Actions */}
              {config.actions === 'single' && (
                <Cell<Product> style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(_v, ctx) => (
                    <button className="action-btn action-btn-view" onClick={() => alert(`View: ${ctx.row.name}`)}>
                      Details
                    </button>
                  )} />
              )}
              {config.actions === 'group' && (
                <Cell<Product> style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(_v, ctx) => (
                    <div className="cell-actions">
                      <button className="action-btn action-btn-view" onClick={() => alert(`View: ${ctx.row.name}`)}>View</button>
                      <button className="action-btn action-btn-edit" onClick={() => alert(`Edit: ${ctx.row.name}`)}>Edit</button>
                      <button className="action-btn action-btn-danger" onClick={() => alert(`Delete: ${ctx.row.name}`)}>Del</button>
                    </div>
                  )} />
              )}

              {/* Link */}
              {config.showLink && (
                <Cell<Product> columnKey="sku" style={densityPadding ? { padding: densityPadding } : undefined}
                  render={(v) => (
                    <a href="#" className="cell-link" onClick={e => e.preventDefault()}>
                      {String(v)}
                    </a>
                  )} />
              )}
            </div>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
