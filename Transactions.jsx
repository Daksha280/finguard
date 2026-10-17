import { useEffect, useState, useCallback } from 'react';
import { transactionsApi, extractErrorMessage } from '../services/api';
import TransactionTable from '../components/TransactionTable';
import { Spinner, ErrorState, EmptyState } from '../components/Feedback';

const DEFAULT_FILTERS = {
  search: '',
  riskLevel: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

export default function Transactions() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...appliedFilters, sortBy, sortDir, page, pageSize };
      Object.keys(params).forEach((key) => {
        if (params[key] === '') delete params[key];
      });
      const res = await transactionsApi.list(params);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function handleApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleSort(column, direction) {
    setSortBy(column);
    setSortDir(direction);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleApplyFilters} className="card space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-500">Search</label>
            <input
              className="input-field"
              placeholder="Txn ID, customer, merchant, location…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Risk Level</label>
            <select
              className="input-field"
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Status</label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="Normal">Normal</option>
              <option value="Under Review">Under Review</option>
              <option value="Flagged">Flagged</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Date From</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Date To</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Min Amount</label>
            <input
              type="number"
              min="0"
              className="input-field"
              placeholder="₹0"
              value={filters.amountMin}
              onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Max Amount</label>
            <input
              type="number"
              min="0"
              className="input-field"
              placeholder="Any"
              value={filters.amountMax}
              onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleReset} className="btn-secondary">
            Reset
          </button>
          <button type="submit" className="btn-primary">
            Apply Filters
          </button>
        </div>
      </form>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions found" message="Try adjusting your search or filters." />
        ) : (
          <>
            <TransactionTable
              transactions={transactions}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
            {pagination && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
                <span>
                  Showing {(pagination.page - 1) * pagination.pageSize + 1}–
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
