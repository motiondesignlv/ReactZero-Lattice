import React from 'react'

export type CursorState = 'idle' | 'pressing' | 'dragging' | 'hidden'

type Props = {
  x: number
  y: number
  state: CursorState
  clickPulseKey: number
}

export const FakeCursor = React.memo(function FakeCursor({ x, y, state, clickPulseKey }: Props) {
  const visible = state !== 'hidden'
  return (
    <div
      className="hero-cursor"
      data-state={state}
      data-visible={visible ? 'true' : 'false'}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      aria-hidden="true"
    >
      <svg width="28" height="32" viewBox="0 0 22 26" fill="none">
        <path
          d="M2 2 L2 20 L7 16 L10 23 L13 21.5 L10 15 L16 15 Z"
          fill="#6366f1"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hero-cursor-label" aria-hidden="true">DEMO</span>
      <span key={clickPulseKey} className="hero-cursor-ring" aria-hidden="true" />
    </div>
  )
})
