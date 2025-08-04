import { useState, useMemo } from 'react'

interface UsePaginationProps<T> {
  data: T[]
  itemsPerPage: number
}

interface UsePaginationReturn<T> {
  currentItems: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  canGoNext: boolean
  canGoPrev: boolean
  pageNumbers: number[]
}

export function usePagination<T>({ data, itemsPerPage }: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)

  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  const pageNumbers = useMemo(() => {
    const pages = []
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, currentPage + 2)
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }, [currentPage, totalPages])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const canGoNext = currentPage < totalPages
  const canGoPrev = currentPage > 1

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    pageNumbers
  }
}