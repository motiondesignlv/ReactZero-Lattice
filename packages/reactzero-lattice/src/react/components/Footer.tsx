// packages/react/src/components/Footer.tsx

import React, { type ReactNode } from 'react'

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div role="rowgroup" data-lattice-footer>
      {children}
    </div>
  )
}
