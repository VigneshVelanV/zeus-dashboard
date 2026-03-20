import {
  CLOSED_STATUS_VALUES,
  DEFAULT_AGE_BUCKETS,
  FIELD_ALIASES,
  STATUS_CLOSED_KEYWORDS,
} from '../config/dashboard';
import type {
  AgeBucketConfig,
  AssignmentGroupSummary,
  ChartDatum,
  DashboardFilters,
  DashboardSummary,
  RawTicket,
  Ticket,
  TicketLifecycleStatus,
} from '../types/ticket';
import { diffInDays, isDateWithinRange, parseDate } from './date';

function getValueByPath(record: RawTicket, alias: string): unknown {
  return alias.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, record);
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return `${value}`;
  }

  if (value && typeof value === 'object') {
    const labeledValue = (value as Record<string, unknown>).label;
    if (typeof labeledValue === 'string' && labeledValue.trim() !== '') {
      return labeledValue.trim();
    }

    const rawValue = (value as Record<string, unknown>).value;
    if (typeof rawValue === 'string' && rawValue.trim() !== '') {
      return rawValue.trim();
    }
  }

  return undefined;
}

function getFirstNumberValue(record: RawTicket, aliases: readonly string[]): number | undefined {
  for (const alias of aliases) {
    const value = getValueByPath(record, alias);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function getFirstStringValue(record: RawTicket, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const coerced = coerceString(getValueByPath(record, alias));
    if (coerced) {
      return coerced;
    }
  }

  return undefined;
}

function normalizeStatus(status?: string): string {
  return status?.trim() || 'Unknown';
}

function inferLifecycleStatus(status: string, closedAt?: string, resolvedAt?: string): TicketLifecycleStatus {
  if (closedAt || resolvedAt) {
    return 'closed';
  }

  const normalized = status.toLowerCase();
  if (CLOSED_STATUS_VALUES.includes(normalized)) {
    return 'closed';
  }
  return STATUS_CLOSED_KEYWORDS.some((keyword) => normalized.includes(keyword)) ? 'closed' : 'open';
}

export function resolveAgeingBucket(ageInDays: number, buckets: AgeBucketConfig[] = DEFAULT_AGE_BUCKETS): string {
  const matchedBucket = buckets.find((bucket) => {
    if (bucket.maxDays === undefined) {
      return ageInDays >= bucket.minDays;
    }

    return ageInDays >= bucket.minDays && ageInDays <= bucket.maxDays;
  });

  return matchedBucket?.label ?? buckets[buckets.length - 1]?.label ?? 'Unknown';
}

export function calculateTicketAge(
  createdAt: string,
  lifecycleStatus: TicketLifecycleStatus,
  currentDate: Date,
  closedAt?: string,
  resolvedAt?: string,
): number {
  const created = parseDate(createdAt);
  if (!created) {
    return 0;
  }

  if (lifecycleStatus === 'closed') {
    const completed = parseDate(closedAt) ?? parseDate(resolvedAt) ?? currentDate;
    return diffInDays(created, completed);
  }

  return diffInDays(created, currentDate);
}

export function normalizeTicket(
  record: RawTicket,
  currentDate: Date = new Date(),
  buckets: AgeBucketConfig[] = DEFAULT_AGE_BUCKETS,
): Ticket | null {
  const id = getFirstStringValue(record, FIELD_ALIASES.id);
  const assignmentGroup = getFirstStringValue(record, FIELD_ALIASES.assignmentGroup) ?? 'Unassigned';
  const status = normalizeStatus(getFirstStringValue(record, FIELD_ALIASES.status));
  const createdAt = getFirstStringValue(record, FIELD_ALIASES.createdAt);

  if (!id || !createdAt) {
    return null;
  }

  const updatedAt = getFirstStringValue(record, FIELD_ALIASES.updatedAt);
  const priority = getFirstStringValue(record, FIELD_ALIASES.priority);
  const title = getFirstStringValue(record, FIELD_ALIASES.title) ?? 'Untitled ticket';
  const requester = getFirstStringValue(record, FIELD_ALIASES.requester);
  const assignee = getFirstStringValue(record, FIELD_ALIASES.assignee);
  const requestType = getFirstStringValue(record, FIELD_ALIASES.requestType);
  const source = getFirstStringValue(record, FIELD_ALIASES.source);
  const countOfExternalChildren = getFirstNumberValue(record, FIELD_ALIASES.countOfExternalChildren);
  const dueAt = getFirstStringValue(record, FIELD_ALIASES.dueAt);
  const resolvedAt = getFirstStringValue(record, FIELD_ALIASES.resolvedAt);
  const closedAt = getFirstStringValue(record, FIELD_ALIASES.closedAt);
  const lifecycleStatus = inferLifecycleStatus(status, closedAt, resolvedAt);
  const ageInDays = calculateTicketAge(createdAt, lifecycleStatus, currentDate, closedAt, resolvedAt);

  return {
    id,
    assignmentGroup,
    status,
    lifecycleStatus,
    requester,
    assignee,
    requestType,
    source,
    countOfExternalChildren,
    createdAt,
    updatedAt,
    priority,
    title,
    dueAt,
    resolvedAt,
    closedAt,
    ageInDays,
    ageingBucket: resolveAgeingBucket(ageInDays, buckets),
  };
}

export function normalizeTickets(
  records: RawTicket[],
  currentDate: Date = new Date(),
  buckets: AgeBucketConfig[] = DEFAULT_AGE_BUCKETS,
): Ticket[] {
  return records
    .map((record) => normalizeTicket(record, currentDate, buckets))
    .filter((ticket): ticket is Ticket => ticket !== null);
}

export function filterTickets(tickets: Ticket[], filters: DashboardFilters): Ticket[] {
  return tickets.filter((ticket) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(ticket.status)) {
      return false;
    }

    if (
      filters.assignmentGroups.length > 0 &&
      !filters.assignmentGroups.includes(ticket.assignmentGroup)
    ) {
      return false;
    }

    if ((filters.createdFrom || filters.createdTo) && !isDateWithinRange(ticket.createdAt, filters.createdFrom, filters.createdTo)) {
      return false;
    }

    return true;
  });
}

function buildChartData(
  groups: AssignmentGroupSummary[],
  keys: string[],
  selector: (group: AssignmentGroupSummary, key: string) => number,
): ChartDatum[] {
  return groups.map((group) => {
    const datum: ChartDatum = {
      assignmentGroup: group.assignmentGroup,
      total: group.total,
    };

    keys.forEach((key) => {
      datum[key] = selector(group, key);
    });

    return datum;
  });
}

export function summarizeTickets(
  tickets: Ticket[],
  buckets: AgeBucketConfig[] = DEFAULT_AGE_BUCKETS,
): DashboardSummary {
  const totalsByStatus: Record<string, number> = {};
  const totalsByBucket: Record<string, number> = Object.fromEntries(
    buckets.map((bucket) => [bucket.label, 0]),
  );

  const groupMap = new Map<string, AssignmentGroupSummary>();
  let totalOpenTickets = 0;
  let totalClosedTickets = 0;
  let ticketsWaitingForBusinessApproval = 0;
  let ticketsForTrainingOrAccess = 0;

  tickets.forEach((ticket) => {
    totalsByStatus[ticket.status] = (totalsByStatus[ticket.status] ?? 0) + 1;

    if (ticket.lifecycleStatus === 'open') {
      totalOpenTickets += 1;
      totalsByBucket[ticket.ageingBucket] = (totalsByBucket[ticket.ageingBucket] ?? 0) + 1;
    } else {
      totalClosedTickets += 1;
    }

    if (ticket.status === 'Waiting for approval') {
      ticketsWaitingForBusinessApproval += 1;
    }

    const rawTicket = ticket as Ticket & { countOfExternalChildren?: number };
    if (ticket.lifecycleStatus === 'closed' && (rawTicket.countOfExternalChildren ?? 0) === 0) {
      ticketsForTrainingOrAccess += 1;
    }

    const existingGroup = groupMap.get(ticket.assignmentGroup) ?? {
      assignmentGroup: ticket.assignmentGroup,
      total: 0,
      byStatus: {},
      byBucket: Object.fromEntries(buckets.map((bucket) => [bucket.label, 0])),
      avgAgeInDays: 0,
      oldestAgeInDays: 0,
    };

    existingGroup.total += 1;
    existingGroup.byStatus[ticket.status] = (existingGroup.byStatus[ticket.status] ?? 0) + 1;

    if (ticket.lifecycleStatus === 'open') {
      existingGroup.byBucket[ticket.ageingBucket] =
        (existingGroup.byBucket[ticket.ageingBucket] ?? 0) + 1;
    }

    existingGroup.avgAgeInDays += ticket.ageInDays;
    existingGroup.oldestAgeInDays = Math.max(existingGroup.oldestAgeInDays, ticket.ageInDays);

    groupMap.set(ticket.assignmentGroup, existingGroup);
  });

  const groups = [...groupMap.values()]
    .map((group) => ({
      ...group,
      avgAgeInDays: group.total > 0 ? Number((group.avgAgeInDays / group.total).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.total - left.total || left.assignmentGroup.localeCompare(right.assignmentGroup));

  const statusKeys = Object.keys(totalsByStatus).sort((left, right) => left.localeCompare(right));
  const bucketKeys = buckets.map((bucket) => bucket.label);

  return {
    tickets,
    groups,
    chartDataByBucket: buildChartData(groups, bucketKeys, (group, key) => group.byBucket[key] ?? 0),
    chartDataByStatus: buildChartData(groups, statusKeys, (group, key) => group.byStatus[key] ?? 0),
    totalsByStatus,
    totalsByBucket,
    metrics: {
      totalTickets: tickets.length,
      totalOpenTickets,
      totalClosedTickets,
      ticketsWaitingForBusinessApproval,
      ticketsForTrainingOrAccess,
    },
  };
}
