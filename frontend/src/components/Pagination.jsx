import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      marginTop: '16px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Showing <span style={{ color: '#fff', fontWeight: 600 }}>{startItem}-{endItem}</span> of <span style={{ color: '#fff', fontWeight: 600 }}>{totalItems}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: page === currentPage ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid',
              borderColor: page === currentPage ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)',
              color: page === currentPage ? '#fff' : 'var(--text-primary)',
              cursor: typeof page === 'number' ? 'pointer' : 'default',
              fontWeight: page === currentPage ? 600 : 400,
              fontSize: '13px'
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
