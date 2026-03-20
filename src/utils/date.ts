export function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDate(value?: string): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = parseDate(value);
  if (!parsed) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function diffInDays(start: Date, end: Date): number {
  const startDay = startOfUtcDay(start);
  const endDay = startOfUtcDay(end);
  const diff = Math.floor((endDay - startDay) / (1000 * 60 * 60 * 24));
  return diff < 0 ? 0 : diff;
}

export function isDateWithinRange(
  value: string,
  from?: string,
  to?: string,
): boolean {
  const parsed = parseDate(value);
  if (!parsed) {
    return false;
  }

  const timestamp = startOfUtcDay(parsed);
  const fromTimestamp = from ? startOfUtcDay(new Date(`${from}T00:00:00Z`)) : undefined;
  const toTimestamp = to ? startOfUtcDay(new Date(`${to}T00:00:00Z`)) : undefined;

  if (fromTimestamp !== undefined && timestamp < fromTimestamp) {
    return false;
  }

  if (toTimestamp !== undefined && timestamp > toTimestamp) {
    return false;
  }

  return true;
}
