export type RawTicket = Record<string, unknown>;

export type TicketLifecycleStatus = 'open' | 'closed';

export interface Ticket {
  id: string;
  assignmentGroup: string;
  status: string;
  lifecycleStatus: TicketLifecycleStatus;
  requester?: string;
  assignee?: string;
  requestType?: string;
  source?: string;
  countOfExternalChildren?: number;
  createdAt: string;
  updatedAt?: string;
  priority?: string;
  title: string;
  dueAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  ageInDays: number;
  ageingBucket: string;
}

export interface AgeBucketConfig {
  label: string;
  minDays: number;
  maxDays?: number;
}

export interface DashboardFilters {
  statuses: string[];
  assignmentGroups: string[];
  createdFrom?: string;
  createdTo?: string;
}

export type ChartSplitMode = 'bucket' | 'status';

export interface ChartDatum {
  assignmentGroup: string;
  total: number;
  [key: string]: string | number;
}

export interface AssignmentGroupSummary {
  assignmentGroup: string;
  total: number;
  byStatus: Record<string, number>;
  byBucket: Record<string, number>;
  avgAgeInDays: number;
  oldestAgeInDays: number;
}

export interface DashboardSummary {
  tickets: Ticket[];
  groups: AssignmentGroupSummary[];
  chartDataByBucket: ChartDatum[];
  chartDataByStatus: ChartDatum[];
  totalsByStatus: Record<string, number>;
  totalsByBucket: Record<string, number>;
  metrics: {
    totalTickets: number;
    totalOpenTickets: number;
    totalClosedTickets: number;
    ticketsWaitingForBusinessApproval: number;
    ticketsForTrainingOrAccess: number;
  };
}
