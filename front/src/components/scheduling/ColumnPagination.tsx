/**
 * ColumnPagination Component
 * Pagination controls for Kanban columns
 */

import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ColumnPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  columnLabel: string;
}

export const ColumnPagination: React.FC<ColumnPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  columnLabel
}) => {
  if (totalPages <= 1) {
    return null; // No pagination needed for single page
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between gap-2">
        {/* Info */}
        <div className="text-xs text-gray-600">
          {startItem}-{endItem} de {totalCount}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPreviousPage}
            className="h-7 w-7 p-0"
            title="Primeira página"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="h-7 w-7 p-0"
            title="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Page Info */}
          <span className="text-xs font-medium px-2 min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="h-7 w-7 p-0"
            title="Próxima página"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            className="h-7 w-7 p-0"
            title="Última página"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

