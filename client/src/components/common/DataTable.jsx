import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'No records found.',
  pagination = true,
  perPage = 10,
  actions,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / perPage);
  const paginated  = pagination ? data.slice((page - 1) * perPage, page * perPage) : data;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Horizontally scrollable wrapper for tables */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm" style={{ minWidth: '500px' }}>
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center text-gray-400 py-12 text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`py-3 px-3 sm:px-4 text-sm ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="py-3 px-3 sm:px-4">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors font-medium"
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium
                    ${p === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors font-medium"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}