import { API_CONFIG } from '../config/dashboard';
import type { RawTicket } from '../types/ticket';

function getValueByPath(payload: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!segment) {
      return current;
    }

    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, payload);
}

function buildHeaders(): HeadersInit | undefined {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_CONFIG.authHeaderValue) {
    headers[API_CONFIG.authHeaderName] = API_CONFIG.authHeaderValue;
  }

  return headers;
}

function resolveRecords(payload: unknown): RawTicket[] {
  const candidates = [
    payload,
    getValueByPath(payload, API_CONFIG.responseDataPath),
    getValueByPath(payload, 'results'),
    getValueByPath(payload, 'items'),
    getValueByPath(payload, 'requests'),
    getValueByPath(payload, 'data.items'),
    getValueByPath(payload, 'data.requests'),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((record): record is RawTicket => !!record && typeof record === 'object');
    }
  }

  throw new Error('Ticket API response does not contain an array of records.');
}

function resolveHasMorePages(payload: unknown, pageNumber: number, recordsLength: number): boolean {
  const candidateValues = [
    getValueByPath(payload, 'has_more'),
    getValueByPath(payload, 'hasMore'),
    getValueByPath(payload, 'meta.has_more'),
    getValueByPath(payload, 'meta.hasMore'),
    getValueByPath(payload, 'pagination.has_more'),
    getValueByPath(payload, 'pagination.hasMore'),
  ];

  for (const value of candidateValues) {
    if (typeof value === 'boolean') {
      return value;
    }
  }

  const totalPages = [
    getValueByPath(payload, 'total_pages'),
    getValueByPath(payload, 'totalPages'),
    getValueByPath(payload, 'meta.total_pages'),
    getValueByPath(payload, 'meta.totalPages'),
    getValueByPath(payload, 'pagination.total_pages'),
    getValueByPath(payload, 'pagination.totalPages'),
  ].find((value): value is number => typeof value === 'number');

  if (typeof totalPages === 'number') {
    return pageNumber < totalPages;
  }

  const nextPage = [
    getValueByPath(payload, 'next_page'),
    getValueByPath(payload, 'nextPage'),
    getValueByPath(payload, 'meta.next_page'),
    getValueByPath(payload, 'meta.nextPage'),
    getValueByPath(payload, 'pagination.next_page'),
    getValueByPath(payload, 'pagination.nextPage'),
  ].find((value) => typeof value === 'number' || typeof value === 'string');

  if (nextPage !== undefined && nextPage !== null && `${nextPage}` !== '') {
    return true;
  }

  const configuredPageSize = API_CONFIG.pageSizePath
    ? getValueByPath(payload, API_CONFIG.pageSizePath)
    : undefined;

  if (typeof configuredPageSize === 'number') {
    return recordsLength >= configuredPageSize;
  }

  return recordsLength > 0;
}

function buildPagedUrl(pageNumber: number): string {
  const rawUrl = `${API_CONFIG.baseUrl}${API_CONFIG.ticketsPath}`;
  const replacedTemplate = rawUrl.replace(/\{pagenumber\}/g, String(pageNumber));

  if (replacedTemplate !== rawUrl) {
    return replacedTemplate;
  }

  const url = new URL(replacedTemplate, window.location.origin);
  url.searchParams.set(API_CONFIG.pageParam, String(pageNumber));
  return url.toString();
}

async function fetchTicketPage(pageNumber: number, signal?: AbortSignal): Promise<{
  records: RawTicket[];
  hasMorePages: boolean;
  pageSize?: number;
}> {
  const response = await fetch(buildPagedUrl(pageNumber), {
    method: 'POST',
    signal,
    headers: buildHeaders(),
    body: '[]',
  });

  if (!response.ok) {
    throw new Error(`Ticket API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const records = resolveRecords(payload);

  return {
    records,
    hasMorePages: resolveHasMorePages(payload, pageNumber, records.length),
    pageSize:
      (typeof getValueByPath(payload, 'page_size') === 'number'
        ? (getValueByPath(payload, 'page_size') as number)
        : undefined) ??
      (typeof getValueByPath(payload, 'pageSize') === 'number'
        ? (getValueByPath(payload, 'pageSize') as number)
        : undefined),
  };
}

export async function fetchTickets(signal?: AbortSignal): Promise<RawTicket[]> {
  const allRecords: RawTicket[] = [];
  const seenIds = new Set<string>();
  let pageNumber = API_CONFIG.pageStart;

  while (pageNumber <= API_CONFIG.maxPages) {
    const { records, hasMorePages, pageSize } = await fetchTicketPage(pageNumber, signal);
    let newRecords = 0;

    records.forEach((record) => {
      const recordId = String(
        (record.display_id as string | number | undefined) ??
          (record.id as string | number | undefined) ??
          `${pageNumber}-${newRecords}`,
      );

      if (!seenIds.has(recordId)) {
        seenIds.add(recordId);
        allRecords.push(record);
        newRecords += 1;
      }
    });

    if (records.length === 0 || newRecords === 0) {
      return allRecords;
    }

    if (pageSize !== undefined && records.length < pageSize) {
      return allRecords;
    }

    if (!hasMorePages && pageSize === undefined) {
      return allRecords;
    }

    pageNumber += 1;
  }

  return allRecords;
}
