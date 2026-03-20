import type { Ticket } from '../types/ticket';
import { formatDate } from '../utils/date';

interface RecentTicketsTableProps {
  tickets: Ticket[];
}

function getStatusClassName(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized.includes('resolved') || normalized.includes('closed') || normalized.includes('cancelled')) {
    return 'status-pill success';
  }

  if (normalized.includes('pending') || normalized.includes('approval')) {
    return 'status-pill warning';
  }

  return 'status-pill active';
}

export function RecentTicketsTable({ tickets }: RecentTicketsTableProps) {
  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live requests</p>
          <h2>Recent ticket activity</h2>
        </div>
        <p className="panel-meta">Latest {tickets.length} requests returned by Atomicwork</p>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Summary</th>
              <th>Group</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Requester</th>
              <th>Assignee</th>
              <th>Age</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="ticket-id-cell">{ticket.id}</td>
                <td>
                  <div className="table-title">{ticket.title}</div>
                  <div className="table-subtitle">
                    {[ticket.requestType, ticket.source].filter(Boolean).join(' · ') || 'Request'}
                  </div>
                </td>
                <td>{ticket.assignmentGroup}</td>
                <td>
                  <span className={getStatusClassName(ticket.status)}>{ticket.status}</span>
                </td>
                <td>{ticket.priority ?? 'N/A'}</td>
                <td>{ticket.requester ?? 'N/A'}</td>
                <td>{ticket.assignee ?? 'Unassigned'}</td>
                <td>{ticket.ageInDays}d</td>
                <td>{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
