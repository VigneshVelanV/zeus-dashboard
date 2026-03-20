import type { DashboardSummary } from '../types/ticket';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const totalTickets = summary.metrics.totalTickets;
  const totalGroups = summary.groups.length;
  const openTickets = summary.metrics.totalOpenTickets;
  const closedTickets = summary.metrics.totalClosedTickets;
  const oldestAge = summary.tickets.reduce((max, ticket) => Math.max(max, ticket.ageInDays), 0);

  const cards = [
    {
      label: 'Visible tickets',
      value: totalTickets,
      meta: `${totalGroups} assignment groups`,
    },
    {
      label: 'Open backlog',
      value: openTickets,
      meta: `${closedTickets} resolved or closed`,
    },
    {
      label: 'Oldest ticket age',
      value: `${oldestAge}d`,
      meta: 'Using created to resolved/closed when available',
    },
    {
      label: 'Business approval',
      value: summary.metrics.ticketsWaitingForBusinessApproval,
      meta: `${summary.metrics.ticketsForTrainingOrAccess} training or access closures`,
    },
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article key={card.label} className="summary-card">
          <p>{card.label}</p>
          <strong>{card.value}</strong>
          <span>{card.meta}</span>
        </article>
      ))}
    </section>
  );
}
