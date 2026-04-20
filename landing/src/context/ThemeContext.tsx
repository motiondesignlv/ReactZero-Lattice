import { createContext, useContext, useState, type ReactNode } from 'react'

export type DemoTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: DemoTheme
  setTheme: (t: DemoTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DemoTheme>('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useDemoTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useDemoTheme must be used inside ThemeProvider')
  return ctx
}
