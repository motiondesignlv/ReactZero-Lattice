// packages/react/src/hooks/usePlugin.ts

import { useGridContext } from '../context'

export function usePlugin<T = any>(id: string): T {
  const grid = useGridContext()
  return grid.getPlugin<T>(id)
}
