import type { DashboardFilters } from '../types/ticket';

interface FilterPanelProps {
  filters: DashboardFilters;
  statusOptions: string[];
  assignmentGroupOptions: string[];
  onChange: (filters: DashboardFilters) => void;
}

function toggleSelection(items: string[], value: string): string[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function FilterPanel({
  filters,
  statusOptions,
  assignmentGroupOptions,
  onChange,
}: FilterPanelProps) {
  return (
    <section className="panel filter-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Controls</p>
          <h2>Filter tickets</h2>
        </div>
      </div>

      <div className="filter-grid">
        <div className="filter-field">
          <label htmlFor="createdFrom">Created from</label>
          <input
            id="createdFrom"
            type="date"
            value={filters.createdFrom ?? ''}
            onChange={(event) => onChange({ ...filters, createdFrom: event.target.value || undefined })}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="createdTo">Created to</label>
          <input
            id="createdTo"
            type="date"
            value={filters.createdTo ?? ''}
            onChange={(event) => onChange({ ...filters, createdTo: event.target.value || undefined })}
          />
        </div>

        <div className="filter-field filter-field-note">
          <span>Applied to ticket `created_at`. Multi-select filters below stay client-side on the live payload.</span>
        </div>
      </div>

      <div className="filter-sections">
        <div className="filter-section">
          <div className="filter-title-row">
            <h3>Status</h3>
            <button type="button" className="ghost-button" onClick={() => onChange({ ...filters, statuses: [] })}>
              Clear
            </button>
          </div>
          <div className="chip-group">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                className={filters.statuses.includes(status) ? 'chip active' : 'chip'}
                onClick={() => onChange({ ...filters, statuses: toggleSelection(filters.statuses, status) })}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title-row">
            <h3>Assignment group</h3>
            <button
              type="button"
              className="ghost-button"
              onClick={() => onChange({ ...filters, assignmentGroups: [] })}
            >
              Clear
            </button>
          </div>
          <div className="chip-group">
            {assignmentGroupOptions.map((group) => (
              <button
                key={group}
                type="button"
                className={filters.assignmentGroups.includes(group) ? 'chip active' : 'chip'}
                onClick={() =>
                  onChange({
                    ...filters,
                    assignmentGroups: toggleSelection(filters.assignmentGroups, group),
                  })
                }
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
