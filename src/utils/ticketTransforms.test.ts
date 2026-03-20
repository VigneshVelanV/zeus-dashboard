import { describe, expect, it } from 'vitest';
import { DEFAULT_AGE_BUCKETS } from '../config/dashboard';
import type { RawTicket } from '../types/ticket';
import {
  calculateTicketAge,
  filterTickets,
  normalizeTickets,
  summarizeTickets,
} from './ticketTransforms';

describe('ticketTransforms', () => {
  it('calculates age for open and closed tickets', () => {
    const now = new Date('2026-03-19T12:00:00Z');

    expect(calculateTicketAge('2026-03-01T00:00:00Z', 'open', now)).toBe(18);
    expect(
      calculateTicketAge(
        '2026-03-01T00:00:00Z',
        'closed',
        now,
        '2026-03-10T00:00:00Z',
      ),
    ).toBe(9);
  });

  it('normalizes, buckets, filters, and summarizes ticket records', () => {
    const records: RawTicket[] = [
      {
        ticket_id: 'INC-1',
        assignment_group: 'Service Desk',
        status: 'Open',
        created_at: '2026-03-10T00:00:00Z',
      },
      {
        ticket_id: 'INC-2',
        assignment_group: 'Service Desk',
        status: 'Closed',
        created_at: '2026-01-01T00:00:00Z',
        closed_at: '2026-02-10T00:00:00Z',
      },
      {
        ticket_id: 'INC-3',
        assignment_group: 'Database Support',
        status: 'Pending',
        created_at: '2025-12-01T00:00:00Z',
      },
    ];

    const normalized = normalizeTickets(records, new Date('2026-03-19T00:00:00Z'), DEFAULT_AGE_BUCKETS);
    expect(normalized).toHaveLength(3);
    expect(normalized[0]?.ageingBucket).toBe('0-15 days');
    expect(normalized[1]?.ageingBucket).toBe('31-60 days');
    expect(normalized[2]?.ageingBucket).toBe('91+ days');

    const filtered = filterTickets(normalized, {
      statuses: ['Open', 'Pending'],
      assignmentGroups: [],
      createdFrom: '2025-12-15',
      createdTo: '2026-12-31',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('INC-1');

    const summary = summarizeTickets(normalized, DEFAULT_AGE_BUCKETS);
    expect(summary.groups).toHaveLength(2);
    expect(summary.totalsByStatus.Open).toBe(1);
    expect(summary.totalsByBucket['91+ days']).toBe(1);
    expect(summary.totalsByBucket['31-60 days']).toBe(0);
    expect(summary.chartDataByBucket[0]?.assignmentGroup).toBe('Service Desk');
  });
});
