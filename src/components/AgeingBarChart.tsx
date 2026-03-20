import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DEFAULT_AGE_BUCKETS } from '../config/dashboard';
import type { ChartDatum, ChartSplitMode, DashboardSummary } from '../types/ticket';

interface AgeingBarChartProps {
  summary: DashboardSummary;
  splitMode: ChartSplitMode;
}

const BUCKET_COLORS = ['#009f97', '#0057b8', '#5d2bff', '#ff6b35', '#0b1f3a'];
const STATUS_COLORS = ['#009f97', '#0b1f3a', '#0057b8', '#4c9aff', '#ff6b35', '#a2e4df', '#7dd3fc'];

function getSeriesKeys(summary: DashboardSummary, splitMode: ChartSplitMode): string[] {
  if (splitMode === 'bucket') {
    return DEFAULT_AGE_BUCKETS.map((bucket) => bucket.label);
  }

  return Object.keys(summary.totalsByStatus);
}

function getChartData(summary: DashboardSummary, splitMode: ChartSplitMode): ChartDatum[] {
  return splitMode === 'bucket' ? summary.chartDataByBucket : summary.chartDataByStatus;
}

export function AgeingBarChart({ summary, splitMode }: AgeingBarChartProps) {
  const data = getChartData(summary, splitMode);
  const seriesKeys = getSeriesKeys(summary, splitMode);
  const palette = splitMode === 'bucket' ? BUCKET_COLORS : STATUS_COLORS;
  const chartHeight = Math.max(420, data.length * 48);

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Visualization</p>
          <h2>Ageing ticket distribution</h2>
        </div>
        <p className="panel-meta">
          Stacked by {splitMode === 'bucket' ? 'ageing bucket' : 'status'}
        </p>
      </div>

      <div className="chart-container" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 16, right: 12, left: 40, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d6dfef" />
            <XAxis allowDecimals={false} type="number" tick={{ fill: '#e8eef8', fontSize: 12 }} />
            <YAxis
              dataKey="assignmentGroup"
              type="category"
              tick={{ fill: '#e8eef8', fontSize: 12 }}
              width={220}
            />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="tickets"
                fill={palette[index % palette.length]}
                radius={index === seriesKeys.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
