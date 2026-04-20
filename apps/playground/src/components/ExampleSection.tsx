import React from 'react'
import { CodeBlock } from './CodeBlock'

export function ExampleSection({
  id,
  title,
  description,
  code,
  children,
}: {
  id: string
  title: string
  description: string
  code: string
  children: React.ReactNode
}) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      <CodeBlock code={code} />
    </section>
  )
}
