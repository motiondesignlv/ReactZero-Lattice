import { useCallback, useEffect, useState } from 'react'

export type PageTheme = 'light' | 'dark'

const STORAGE_KEY = 'lattice-theme'

function readInitial(): PageTheme {
  if (typeof document === 'undefined') return 'light'
  const attr = document.documentElement.dataset.theme
  return attr === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<PageTheme>(readInitial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore — private mode or disabled storage
    }
  }, [theme])

  const setTheme = useCallback((next: PageTheme) => setThemeState(next), [])
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'light' ? 'dark' : 'light')),
    []
  )

  return { theme, setTheme, toggleTheme }
}
