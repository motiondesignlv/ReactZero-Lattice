import React, { useState } from 'react'

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="code-block">
      <button className="code-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Show'} Code{title ? `: ${title}` : ''}
      </button>
      {expanded && (
        <pre className="code-pre">
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  )
}
