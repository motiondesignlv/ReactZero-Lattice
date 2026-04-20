import React from 'react'
import { BasicGrid } from './examples/BasicGrid'
import { SortableGrid } from './examples/SortableGrid'
import { FilterableGrid } from './examples/FilterableGrid'
import { PaginatedGrid } from './examples/PaginatedGrid'
import { ColumnPickerGrid } from './examples/ColumnPickerGrid'
import { ColumnWidthsGrid } from './examples/ColumnWidthsGrid'
import { RichContentGrid } from './examples/RichContentGrid'
import { ColumnReorderGrid } from './examples/ColumnReorderGrid'
import { KitchenSinkGrid } from './examples/KitchenSinkGrid'
import { CellPlayground } from './examples/CellPlayground'
import { CSSThemingGrid } from './examples/CSSThemingGrid'
import { HeadlessGrid } from './examples/HeadlessGrid'
import { ResponsiveGrid } from './examples/ResponsiveGrid'
import { LayoutModesGrid } from './examples/LayoutModesGrid'
import { ExpandableGrid } from './examples/ExpandableGrid'
import { OverflowGrid } from './examples/OverflowGrid'

const examples = [
  { id: 'basic', label: 'Basic' },
  { id: 'sortable', label: 'Sort' },
  { id: 'filterable', label: 'Filter' },
  { id: 'paginated', label: 'Paginate' },
  { id: 'column-picker', label: 'Column Picker' },
  { id: 'column-widths', label: 'Column Widths' },
  { id: 'rich-content', label: 'Rich Content' },
  { id: 'column-reorder', label: 'Reorder' },
  { id: 'cell-playground', label: 'Cell Lab' },
  { id: 'css-theming', label: 'CSS Theming' },
  { id: 'responsive', label: 'Responsive' },
  { id: 'layout-modes', label: 'Layout Modes' },
  { id: 'expandable', label: 'Expandable' },
  { id: 'overflow', label: 'Overflow' },
  { id: 'headless', label: 'Headless API' },
  { id: 'kitchen-sink', label: 'Kitchen Sink' },
]

export default function App() {
  return (
    <div className="playground">
      <header className="playground-header">
        <h1>Lattice</h1>
        <p className="tagline">A cell-first, composable React data grid</p>
        <nav className="section-nav">
          {examples.map(ex => (
            <a key={ex.id} href={`#${ex.id}`}>{ex.label}</a>
          ))}
        </nav>
      </header>
      <main className="playground-main">
        <BasicGrid />
        <SortableGrid />
        <FilterableGrid />
        <PaginatedGrid />
        <ColumnPickerGrid />
        <ColumnWidthsGrid />
        <RichContentGrid />
        <ColumnReorderGrid />
        <CellPlayground />
        <CSSThemingGrid />
        <ResponsiveGrid />
        <LayoutModesGrid />
        <ExpandableGrid />
        <OverflowGrid />
        <HeadlessGrid />
        <KitchenSinkGrid />
      </main>
      <footer className="playground-footer">
        <p>Lattice v0.1.0 &mdash; Each example has a "Show Code" button to see the JSX.</p>
      </footer>
    </div>
  )
}
