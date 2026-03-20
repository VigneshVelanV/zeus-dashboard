import { DEFAULT_AGE_BUCKETS } from '../config/dashboard';
import type { DashboardSummary } from '../types/ticket';

interface BucketOverviewProps {
  summary: DashboardSummary;
}

export function BucketOverview({ summary }: BucketOverviewProps) {
  const total = summary.metrics.totalOpenTickets || 1;

  return (
    <section className="panel bucket-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Ageing buckets</p>
          <h2>Open ticket distribution</h2>
        </div>
      </div>

      <div className="bucket-grid">
        {DEFAULT_AGE_BUCKETS.map((bucket) => {
          const count = summary.totalsByBucket[bucket.label] ?? 0;
          const percentage = Math.round((count / total) * 100);

          return (
            <article key={bucket.label} className="bucket-card">
              <span>{bucket.label}</span>
              <strong>{count}</strong>
              <div className="bucket-meter" aria-hidden="true">
                <div style={{ width: `${percentage}%` }} />
              </div>
              <small>{percentage}% of open tickets</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
