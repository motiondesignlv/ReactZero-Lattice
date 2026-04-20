// packages/paginate/src/index.ts

import type { LatticePlugin } from '../core/types'

export type PaginationProps = {
  role: 'navigation'
  'aria-label': string
}

export type PageButtonProps = {
  type: 'button'
  'aria-label': string
  'aria-current': 'page' | undefined
  onClick: () => void
  'data-lattice-page-btn': true
}

export type PageSizeSelectProps = {
  'aria-label': string
  value: number
  onChange: (e: { target: { value: string } }) => void
  'data-lattice-page-size': true
}

export type PaginatePluginAPI = {
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPrevPage: () => void
  setPageSize: (size: number) => void
  currentPage: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  getPaginationProps: (label?: string) => PaginationProps
  getPageButtonProps: (page: number, label?: string) => PageButtonProps
  getPrevButtonProps: (label?: string) => PageButtonProps
  getNextButtonProps: (label?: string) => PageButtonProps
  getPageSizeSelectProps: (label?: string) => PageSizeSelectProps
  getPageStatusMessage: () => string
}

export type PaginationSnapshot = {
  currentPage: number
  pageSize: number
}

export type PaginatePluginOptions = {
  pageSize?: number
  manual?: boolean
  onPaginationChange?: (pagination: PaginationSnapshot) => void
}

export function paginatePlugin<TData>(options: PaginatePluginOptions = {}): LatticePlugin<TData, PaginatePluginAPI> {
  const { pageSize: defaultPageSize = 20, manual = false, onPaginationChange } = options

  function clampPage(page: number, totalPages: number): number {
    const maxPage = Math.max(totalPages - 1, 0)
    if (!Number.isFinite(page)) return 0
    return Math.min(Math.max(0, Math.floor(page)), maxPage)
  }

  return {
    id: 'paginate',

    initialState: {
      currentPage: 0,
      pageSize: defaultPageSize,
    },

    init({ grid, dispatch }) {
      const emit = (currentPage: number, pageSize: number) => {
        if (manual && onPaginationChange) onPaginationChange({ currentPage, pageSize })
      }

      const goToPage = (page: number) => {
        const next = clampPage(page, grid.totalPages)
        dispatch({ type: 'SET_PAGE', payload: next })
        emit(next, grid.state.pageSize)
      }

      const goToNextPage = () => {
        const next = clampPage(grid.state.currentPage + 1, grid.totalPages)
        dispatch({ type: 'SET_PAGE', payload: next })
        emit(next, grid.state.pageSize)
      }

      const goToPrevPage = () => {
        const prev = clampPage(grid.state.currentPage - 1, grid.totalPages)
        dispatch({ type: 'SET_PAGE', payload: prev })
        emit(prev, grid.state.pageSize)
      }

      const setPageSize = (size: number) => {
        const nextSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 1
        dispatch({ type: 'SET_PAGE_SIZE', payload: nextSize })
        emit(0, nextSize)
      }

      return {
        goToPage,
        goToNextPage,
        goToPrevPage,
        setPageSize,

        get currentPage() { return grid.state.currentPage },
        get pageSize() { return grid.state.pageSize },
        get totalPages() { return grid.totalPages },
        get hasNextPage() { return grid.state.currentPage < grid.totalPages - 1 },
        get hasPrevPage() { return grid.state.currentPage > 0 },

        getPaginationProps: (label = 'Pagination') => ({
          role: 'navigation',
          'aria-label': label,
        }),

        getPageButtonProps: (page, label) => {
          const isCurrent = grid.state.currentPage === page
          return {
            type: 'button',
            'aria-label': label ?? (isCurrent ? `Current page, page ${page + 1}` : `Go to page ${page + 1}`),
            'aria-current': isCurrent ? 'page' : undefined,
            onClick: () => goToPage(page),
            'data-lattice-page-btn': true,
          }
        },

        getPrevButtonProps: (label = 'Go to previous page') => ({
          type: 'button',
          'aria-label': label,
          'aria-current': undefined,
          onClick: goToPrevPage,
          'data-lattice-page-btn': true,
        }),

        getNextButtonProps: (label = 'Go to next page') => ({
          type: 'button',
          'aria-label': label,
          'aria-current': undefined,
          onClick: goToNextPage,
          'data-lattice-page-btn': true,
        }),

        getPageSizeSelectProps: (label = 'Results per page') => ({
          'aria-label': label,
          value: grid.state.pageSize,
          onChange: (e) => setPageSize(Number(e.target.value)),
          'data-lattice-page-size': true,
        }),

        getPageStatusMessage: () => {
          const total = grid.totalPages
          if (total <= 1) return `Page 1 of 1`
          return `Page ${grid.state.currentPage + 1} of ${total}`
        },
      }
    },

    processPaginatedRows(rows, state) {
      if (manual) return rows
      const pageSize = Math.max(state.pageSize, 1)
      const start = Math.max(state.currentPage, 0) * pageSize
      const end = start + pageSize
      return rows.slice(start, end)
    },
  }
}
