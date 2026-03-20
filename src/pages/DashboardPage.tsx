import { useMemo, useState } from 'react';
import { AgeingBarChart } from '../components/AgeingBarChart';
import { AssignmentGroupTable } from '../components/AssignmentGroupTable';
import { FilterPanel } from '../components/FilterPanel';
import { useTicketsDashboard } from '../hooks/useTicketsDashboard';
import { formatDate } from '../utils/date';
import type { ChartSplitMode, DashboardFilters } from '../types/ticket';

const INITIAL_FILTERS: DashboardFilters = {
  statuses: [],
  assignmentGroups: [],
};

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [splitMode, setSplitMode] = useState<ChartSplitMode>('bucket');
  const { loading, error, tickets, summary, refresh, hasLoadedOnce } = useTicketsDashboard(filters);

  const statusOptions = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.status))].sort((left, right) => left.localeCompare(right)),
    [tickets],
  );
  const assignmentGroupOptions = useMemo(
    () =>
      [...new Set(tickets.map((ticket) => ticket.assignmentGroup))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [tickets],
  );
  const createdDates = useMemo(() => tickets.map((ticket) => ticket.createdAt).sort(), [tickets]);
  const latestCreatedAt = createdDates[createdDates.length - 1];
  const earliestCreatedAt = createdDates[0];

  return (
    <main className="dashboard-shell">
      {loading ? (
        <section className={hasLoadedOnce ? 'loading-overlay inline' : 'loading-overlay'}>
          <div className="loading-card" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true" />
            <strong>{hasLoadedOnce ? 'Refreshing ticket data' : 'Loading ticket dashboard'}</strong>
            <p>
              {hasLoadedOnce
                ? 'Fetching the latest ticket pages and recalculating ageing buckets.'
                : 'Pulling ticket pages from Atomicwork and preparing the dashboard view.'}
            </p>
          </div>
        </section>
      ) : null}

      <section className="title-band panel">
        <div>
          <p className="eyebrow">ITSM Analytics</p>
          <h1>Assignment Group Ageing Overview</h1>
          <p className="title-copy">
            Open ticket ageing across assignment groups, filtered from live Atomicwork request data.
          </p>
        </div>

        <div className="title-actions">
          <div className="title-meta">
            <strong>{summary.metrics.totalOpenTickets}</strong>
            <span>open tickets in view</span>
            <small>
              {earliestCreatedAt ? `${formatDate(earliestCreatedAt)} to ${formatDate(latestCreatedAt)}` : 'No records'}
            </small>
          </div>
          <button type="button" className="refresh-button" onClick={refresh}>
            {loading && hasLoadedOnce ? 'Refreshing...' : 'Refresh data'}
          </button>
          <div className="segmented-control" role="tablist" aria-label="Chart split mode">
            <button
              type="button"
              className={splitMode === 'bucket' ? 'active' : ''}
              onClick={() => setSplitMode('bucket')}
            >
              Split by ageing
            </button>
            <button
              type="button"
              className={splitMode === 'status' ? 'active' : ''}
              onClick={() => setSplitMode('status')}
            >
              Split by status
            </button>
          </div>
        </div>
      </section>

      <FilterPanel
        filters={filters}
        statusOptions={statusOptions}
        assignmentGroupOptions={assignmentGroupOptions}
        onChange={setFilters}
      />

      {!loading && error ? <section className="panel state-panel error">{error}</section> : null}
      {!loading && !error && summary.tickets.length === 0 ? (
        <section className="panel state-panel">No tickets match the current filters.</section>
      ) : null}

      {!loading && !error && summary.tickets.length > 0 ? (
        <>
          <AgeingBarChart summary={summary} splitMode={splitMode} />
          <AssignmentGroupTable summary={summary} />
        </>
      ) : null}
    </main>
  );
}
