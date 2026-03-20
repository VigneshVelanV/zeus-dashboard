import type { AgeBucketConfig } from '../types/ticket';

export const DEFAULT_AGE_BUCKETS: AgeBucketConfig[] = [
  { label: '0-15 days', minDays: 0, maxDays: 15 },
  { label: '16-30 days', minDays: 16, maxDays: 30 },
  { label: '31-60 days', minDays: 31, maxDays: 60 },
  { label: '61-90 days', minDays: 61, maxDays: 90 },
  { label: '91+ days', minDays: 91 },
];

export const STATUS_CLOSED_KEYWORDS = [
  'closed',
  'resolved',
  'done',
  'complete',
  'completed',
  'cancelled',
  'canceled',
];

export const CLOSED_STATUS_VALUES = ['closed', 'resolved', 'cancelled', 'canceled'];

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  ticketsPath: import.meta.env.VITE_TICKETS_PATH ?? '/api/tickets',
  responseDataPath: import.meta.env.VITE_TICKETS_DATA_PATH ?? 'data',
  authHeaderName: import.meta.env.VITE_API_AUTH_HEADER ?? 'Authorization',
  authHeaderValue: import.meta.env.VITE_API_AUTH_VALUE ?? '',
  pageParam: import.meta.env.VITE_TICKETS_PAGE_PARAM ?? 'page',
  pageStart: Number(import.meta.env.VITE_TICKETS_PAGE_START ?? '1'),
  pageSizePath: import.meta.env.VITE_TICKETS_PAGE_SIZE_PATH ?? '',
  maxPages: Number(import.meta.env.VITE_TICKETS_MAX_PAGES ?? '250'),
};

export const FIELD_ALIASES = {
  id: ['display_id', 'displayId', 'id', 'ticket_id', 'ticketId', 'number', 'sys_id'],
  assignmentGroup: [
    'agent_group.label',
    'assignment_group',
    'assignmentGroup',
    'group',
    'assignmentGroupName',
  ],
  status: ['status.label', 'status.value', 'status', 'state'],
  createdAt: ['created_at', 'createdAt', 'opened_at', 'openDate'],
  updatedAt: ['updated_at', 'updatedAt', 'last_updated'],
  priority: ['priority.label', 'priority.value', 'priority', 'severity'],
  title: ['subject', 'short_description', 'shortDescription', 'title', 'summary'],
  requester: ['requester.label', 'requester.name', 'requester'],
  assignee: ['assignee.label', 'assignee.name', 'assignee'],
  requestType: ['request_type', 'requestType', 'type'],
  source: ['request_source', 'requestSource', 'source'],
  countOfExternalChildren: ['count_of_external_children', 'countOfExternalChildren'],
  dueAt: ['due_date', 'dueDate'],
  resolvedAt: [
    'sla.resolution_at',
    'resolved_at',
    'resolvedAt',
    'resolved_date',
    'resolutionDate',
  ],
  closedAt: ['closed_at', 'closedAt', 'closed_date', 'closeDate'],
} as const;
