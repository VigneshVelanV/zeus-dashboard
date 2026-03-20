import { DEFAULT_AGE_BUCKETS } from '../config/dashboard';
import type { DashboardSummary } from '../types/ticket';

interface AssignmentGroupTableProps {
  summary: DashboardSummary;
}

export function AssignmentGroupTable({ summary }: AssignmentGroupTableProps) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Assignment group breakdown</h2>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Assignment group</th>
              <th>Total</th>
              <th>Status mix</th>
              <th>Avg age</th>
              <th>Oldest</th>
              {DEFAULT_AGE_BUCKETS.map((bucket) => (
                <th key={bucket.label}>{bucket.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.groups.map((group) => (
              <tr key={group.assignmentGroup}>
                <td>{group.assignmentGroup}</td>
                <td>{group.total}</td>
                <td className="status-mix-cell">
                  {Object.entries(group.byStatus)
                    .sort((left, right) => right[1] - left[1])
                    .slice(0, 2)
                    .map(([status, count]) => `${status} ${count}`)
                    .join(' · ')}
                </td>
                <td>{group.avgAgeInDays}d</td>
                <td>{group.oldestAgeInDays}d</td>
                {DEFAULT_AGE_BUCKETS.map((bucket) => (
                  <td key={bucket.label}>{group.byBucket[bucket.label] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
