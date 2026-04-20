// packages/react/src/components/LiveRegion.tsx

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LiveRegionContext, type LiveRegionContextValue, type LiveRegionPriority } from '../context'

export type LiveRegionProps = {
  children?: ReactNode
  debounceMs?: number
}

const visuallyHidden = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden' as const,
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
}

export function LiveRegionProvider({ children, debounceMs = 150 }: LiveRegionProps) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const politeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const assertiveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const value = useMemo<LiveRegionContextValue>(() => ({
    announce: (message, priority: LiveRegionPriority = 'polite') => {
      if (!message) return
      if (priority === 'assertive') {
        clearTimeout(assertiveTimer.current)
        assertiveTimer.current = setTimeout(() => setAssertive(m => (m === message ? `${message} ` : message)), debounceMs)
      } else {
        clearTimeout(politeTimer.current)
        politeTimer.current = setTimeout(() => setPolite(m => (m === message ? `${message} ` : message)), debounceMs)
      }
    },
  }), [debounceMs])

  useEffect(() => () => {
    clearTimeout(politeTimer.current)
    clearTimeout(assertiveTimer.current)
  }, [])

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-lattice-visually-hidden
        data-lattice-live-region="polite"
        style={visuallyHidden}
      >
        {polite}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-lattice-visually-hidden
        data-lattice-live-region="assertive"
        style={visuallyHidden}
      >
        {assertive}
      </div>
    </LiveRegionContext.Provider>
  )
}

LiveRegionProvider.displayName = 'LatticeLiveRegionProvider'
