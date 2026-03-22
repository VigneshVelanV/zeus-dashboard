import { useEffect, useMemo, useState } from 'react';
import { fetchTickets } from '../api/tickets';
import { DEFAULT_AGE_BUCKETS } from '../config/dashboard';
import { mockTickets } from '../data/mockTickets';
import type { DashboardFilters, DashboardSummary, RawTicket, Ticket } from '../types/ticket';
import { filterTickets, normalizeTickets, summarizeTickets } from '../utils/ticketTransforms';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export interface DashboardState {
  loading: boolean;
  error?: string;
  tickets: Ticket[];
  summary: DashboardSummary;
  refresh: () => void;
  hasLoadedOnce: boolean;
}

const EMPTY_SUMMARY: DashboardSummary = {
  tickets: [],
  groups: [],
  chartDataByBucket: [],
  chartDataByStatus: [],
  totalsByStatus: {},
  totalsByBucket: Object.fromEntries(DEFAULT_AGE_BUCKETS.map((bucket) => [bucket.label, 0])),
  metrics: {
    totalTickets: 0,
    totalOpenTickets: 0,
    totalClosedTickets: 0,
    ticketsWaitingForBusinessApproval: 0,
    ticketsForTrainingOrAccess: 0,
  },
};

export function useTicketsDashboard(filters: DashboardFilters): DashboardState {
  const [records, setRecords] = useState<RawTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(undefined);

        const nextRecords = USE_MOCK_DATA ? mockTickets : await fetchTickets(controller.signal);
        setRecords(nextRecords);
        setHasLoadedOnce(true);
      } catch (loadError) {
        if ((loadError as Error).name === 'AbortError') {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load ticket data.');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [refreshIndex]);

  const tickets = useMemo(() => normalizeTickets(records, new Date(), DEFAULT_AGE_BUCKETS), [records]);
  const filteredTickets = useMemo(() => filterTickets(tickets, filters), [filters, tickets]);
  const summary = useMemo(
    () => (filteredTickets.length > 0 ? summarizeTickets(filteredTickets, DEFAULT_AGE_BUCKETS) : EMPTY_SUMMARY),
    [filteredTickets],
  );

  return {
    loading,
    error,
    tickets,
    summary,
    refresh: () => setRefreshIndex((value) => value + 1),
    hasLoadedOnce,
  };
}
