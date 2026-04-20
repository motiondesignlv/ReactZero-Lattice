import React, { useState, useRef, useEffect } from 'react'
import { Grid, Row, Cell } from 'reactzero-lattice/react/components'
import { buildGridTemplate } from 'reactzero-lattice/react/utils'
import { ExampleSection } from '../components/ExampleSection'
import type { ColumnDef } from 'reactzero-lattice/core/types'

type Article = {
  id: number
  title: string
  author: string
  excerpt: string
  category: string
  published: string
  wordCount: number
}

const articles: Article[] = [
  { id: 1, title: 'Building Scalable React Applications with Modern Patterns and Best Practices', author: 'Alice Johnson', excerpt: 'Learn how to structure large React applications using advanced patterns like compound components, render props, and custom hooks for maximum reusability and maintainability across your entire codebase.', category: 'Engineering', published: '2025-01-15', wordCount: 2400 },
  { id: 2, title: 'The Future of CSS: Container Queries, Cascade Layers, and Beyond', author: 'Bob Smith', excerpt: 'CSS is evolving rapidly with new features that change how we think about responsive design. Container queries let components respond to their parent size, not just the viewport. Cascade layers give us better control over specificity.', category: 'Design', published: '2025-02-03', wordCount: 1800 },
  { id: 3, title: 'TypeScript 6.0: What Developers Need to Know About the Latest Release', author: 'Carol Williams', excerpt: 'The latest TypeScript release brings significant improvements including better type inference, faster compilation times, and new syntax features that make type-safe code easier to write and maintain.', category: 'Engineering', published: '2025-01-28', wordCount: 3100 },
  { id: 4, title: 'Data Grid Performance Optimization Techniques for Large Datasets', author: 'David Brown', excerpt: 'When rendering thousands of rows in a data grid, performance becomes critical. This guide covers virtualization, memoization, pagination strategies, and efficient DOM updates for smooth scrolling.', category: 'Performance', published: '2025-02-10', wordCount: 2700 },
  { id: 5, title: 'Accessibility in Web Components: A Comprehensive Guide to ARIA', author: 'Eve Davis', excerpt: 'Making interactive components accessible requires careful attention to ARIA roles, keyboard navigation, focus management, and screen reader compatibility. Here is a thorough walkthrough of best practices.', category: 'Accessibility', published: '2025-01-20', wordCount: 3500 },
  { id: 6, title: 'Micro-Frontend Architecture: When and How to Split Your Monolith', author: 'Frank Miller', excerpt: 'Micro-frontends extend the microservices pattern to the frontend. Learn when this architecture makes sense, common implementation strategies, and pitfalls to avoid during migration.', category: 'Architecture', published: '2025-02-08', wordCount: 2200 },
]

const columns: ColumnDef<Article>[] = [
  { key: 'title', header: 'Title', minWidth: 200, maxWidth: 350 },
  { key: 'author', header: 'Author', width: 140 },
  { key: 'excerpt', header: 'Excerpt', minWidth: 150, maxWidth: 300 },
  { key: 'category', header: 'Category', width: 110 },
  { key: 'wordCount', header: 'Words', width: 70 },
]

const gridTemplate = buildGridTemplate(columns)

const code = `import { buildGridTemplate } from 'reactzero-lattice/react/utils'

const columns: ColumnDef<Article>[] = [
  { key: 'title', minWidth: 200, maxWidth: 350 },
  { key: 'author', width: 140 },
  { key: 'excerpt', minWidth: 150, maxWidth: 300 },
  { key: 'category', width: 110 },
  { key: 'wordCount', width: 70 },
]

// Auto-generates: "minmax(200px, 350px) 140px minmax(150px, 300px) 110px 70px"
const gridTemplate = buildGridTemplate(columns)

// Ellipsis with tooltip — overflow="ellipsis" adds data-overflow attr
// CSS handles: text-overflow: ellipsis; white-space: nowrap;
<Cell columnKey="title" overflow="ellipsis" title={true} />

// Actions menu dropdown in a cell
<Cell render={(_v, ctx) => (
  <ActionsMenu row={ctx.row} />
)} />`

function ActionsMenu({ row }: { row: Article }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="cell-dropdown" ref={ref}>
      <button
        className="action-btn action-btn-view"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        &#x22EF;
      </button>
      {open && (
        <div className="cell-dropdown-menu">
          <button className="dropdown-item" onClick={() => { alert(`View: ${row.title}`); setOpen(false) }}>
            View Article
          </button>
          <button className="dropdown-item" onClick={() => { alert(`Edit: ${row.title}`); setOpen(false) }}>
            Edit
          </button>
          <button className="dropdown-item" onClick={() => { alert(`Share: ${row.title}`); setOpen(false) }}>
            Share Link
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item dropdown-item-danger" onClick={() => { alert(`Delete: ${row.title}`); setOpen(false) }}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function OverflowGrid() {
  const [overflowMode, setOverflowMode] = useState<'ellipsis' | 'wrap' | 'clip'>('ellipsis')

  return (
    <ExampleSection
      id="overflow"
      title="Overflow & Dropdowns"
      description="Column widths are enforced via buildGridTemplate() with min/max constraints. Long text uses ellipsis with native tooltip on hover. Actions menu opens as a dropdown overlay."
      code={code}
    >
      {/* Overflow mode selector */}
      <div className="overflow-mode-selector">
        <span className="pattern-label">Overflow mode:</span>
        {(['ellipsis', 'wrap', 'clip'] as const).map(m => (
          <button
            key={m}
            className={`pattern-btn ${overflowMode === m ? 'active' : ''}`}
            onClick={() => setOverflowMode(m)}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-info">
        <code>buildGridTemplate(columns)</code> → <code>{gridTemplate}</code>
      </div>

      <Grid data={articles} columns={columns} rowKey="id" aria-label="Overflow grid">
        <Grid.Header>
          <div className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate + ' 50px' }}>
            <div className="cell">Title</div>
            <div className="cell">Author</div>
            <div className="cell">Excerpt</div>
            <div className="cell">Category</div>
            <div className="cell">Words</div>
            <div className="cell"></div>
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div className="grid-row" style={{ gridTemplateColumns: gridTemplate + ' 50px' }}>
              <Cell<Article>
                columnKey="title"
                overflow={overflowMode}
                title={true}
              />
              <Cell columnKey="author" overflow={overflowMode} title={true} />
              <Cell<Article>
                columnKey="excerpt"
                overflow={overflowMode}
                title={true}
              />
              <Cell<Article> columnKey="category" render={(v) => (
                <span className={`category-badge category-${String(v).toLowerCase()}`}>{String(v)}</span>
              )} />
              <Cell<Article> columnKey="wordCount" render={(v) => (
                <span>{Number(v).toLocaleString()}</span>
              )} />
              <Cell<Article> render={(_v, ctx) => (
                <ActionsMenu row={ctx.row} />
              )} />
            </div>
          </Row>
        </Grid.Body>
      </Grid>
    </ExampleSection>
  )
}
