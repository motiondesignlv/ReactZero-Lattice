// packages/react/src/components/Header.tsx

import { type ReactNode } from 'react'
import { useGridContext } from '../context'

export function Header({ children }: { children: ReactNode }) {
  const grid = useGridContext()
  return (
    <div {...grid.getHeaderProps()} data-lattice-header>
      {children}
    </div>
  )
}

Header.displayName = 'LatticeHeader'
