type JsonRecord = Record<string, unknown>;

function json(status: number, payload: JsonRecord): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function buildUpstreamUrl(request: Request): string {
  const targetBaseUrl = process.env.ATOMICWORK_PROXY_TARGET;
  const ticketsPathTemplate = process.env.ATOMICWORK_TICKETS_PATH;
  const defaultPage = process.env.VITE_TICKETS_PAGE_START ?? '1';

  if (!targetBaseUrl || !ticketsPathTemplate) {
    throw new Error('Missing ATOMICWORK_PROXY_TARGET or ATOMICWORK_TICKETS_PATH.');
  }

  const incomingUrl = new URL(request.url);
  const pageNumber = incomingUrl.searchParams.get('page') ?? defaultPage;
  const targetPath = ticketsPathTemplate.replace(/\{pagenumber\}/g, pageNumber);

  return new URL(targetPath, targetBaseUrl).toString();
}

async function proxy(request: Request): Promise<Response> {
  const apiKey = process.env.ATOMICWORK_API_KEY;

  if (!apiKey) {
    return json(500, { message: 'Missing ATOMICWORK_API_KEY.' });
  }

  let upstreamUrl: string;

  try {
    upstreamUrl = buildUpstreamUrl(request);
  } catch (error) {
    return json(500, {
      message: error instanceof Error ? error.message : 'Unable to build upstream request.',
    });
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      'x-api-key': apiKey,
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    return proxy(request);
  },
};
