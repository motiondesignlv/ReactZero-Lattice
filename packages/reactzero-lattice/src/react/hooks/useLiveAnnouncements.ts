// packages/react/src/hooks/useLiveAnnouncements.ts

import { useEffect, useRef } from 'react'
import { useLiveRegion } from '../context'
import type { GridInstance, GridState } from '../../core/types'

export function useLiveAnnouncements<TData>(grid: GridInstance<TData>, state: GridState<TData>) {
  const { announce } = useLiveRegion()
  const prev = useRef<{
    sortKey: string
    filter: string
    page: number
    filteredCount: number
  }>({
    sortKey: '',
    filter: '',
    page: state.currentPage,
    filteredCount: grid.totalFilteredRows,
  })
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    const sortKey = state.sortState
      .map(s => `${String(s.key)}:${s.direction}`)
      .join(',')
    const filter = `${state.globalFilter}|${Object.entries(state.columnFilters)
      .map(([k, v]) => `${k}:${v}`).join(',')}`

    if (sortKey !== prev.current.sortKey && grid.hasPlugin('sort')) {
      const sort = grid.getPlugin<{ getSortStatusMessage: () => string }>('sort')
      announce(sort.getSortStatusMessage(), 'polite')
    }

    if (filter !== prev.current.filter && grid.hasPlugin('filter')) {
      const plugin = grid.getPlugin<{ getFilterStatusMessage: () => string }>('filter')
      announce(plugin.getFilterStatusMessage(), 'polite')
    }

    if (state.currentPage !== prev.current.page && grid.hasPlugin('paginate')) {
      const plugin = grid.getPlugin<{ getPageStatusMessage: () => string }>('paginate')
      announce(plugin.getPageStatusMessage(), 'polite')
    }

    prev.current = {
      sortKey,
      filter,
      page: state.currentPage,
      filteredCount: grid.totalFilteredRows,
    }
  }, [state.sortState, state.globalFilter, state.columnFilters, state.currentPage, grid.totalFilteredRows, grid, announce])
}
