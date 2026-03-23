import http from 'node:http';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

async function proxyAtomicworkRequest(
  targetBaseUrl: string,
  targetPath: string,
  apiKey: string,
  req: http.IncomingMessage,
  body: string,
): Promise<{
  statusCode: number;
  contentType?: string;
  body: string;
}> {
  const targetUrl = new URL(targetPath, targetBaseUrl);

  console.log('[v0] Proxying to:', targetUrl.toString());

  const response = await fetch(targetUrl.toString(), {
    method: req.method ?? 'GET',
    headers: {
      'Content-Type': req.headers['content-type']?.toString() || 'application/json',
      'x-api-key': apiKey,
    },
    body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : body,
  });

  const responseBody = await response.text();

  console.log('[v0] Upstream response status:', response.status);

  return {
    statusCode: response.status,
    contentType: response.headers.get('content-type') || 'application/json',
    body: responseBody,
  };
}

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  // Fallback to process.env if loadEnv doesn't have the values (for v0 Vars tab)
  const env = {
    ATOMICWORK_PROXY_TARGET: process.env.ATOMICWORK_PROXY_TARGET || loadedEnv.ATOMICWORK_PROXY_TARGET,
    ATOMICWORK_API_KEY: process.env.ATOMICWORK_API_KEY || loadedEnv.ATOMICWORK_API_KEY,
    ATOMICWORK_TICKETS_PATH: process.env.ATOMICWORK_TICKETS_PATH || loadedEnv.ATOMICWORK_TICKETS_PATH,
    VITE_TICKETS_PAGE_START: process.env.VITE_TICKETS_PAGE_START || loadedEnv.VITE_TICKETS_PAGE_START,
  };
  const ticketsPathTemplate = env.ATOMICWORK_TICKETS_PATH ?? '';

  return {
    plugins: [
      react(),
      {
        name: 'atomicwork-dev-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            console.log('[v0] Middleware hit:', req.url);
            console.log('[v0] ATOMICWORK_PROXY_TARGET:', env.ATOMICWORK_PROXY_TARGET);
            console.log('[v0] ATOMICWORK_API_KEY present:', !!env.ATOMICWORK_API_KEY);
            console.log('[v0] ticketsPathTemplate:', ticketsPathTemplate);

            if (
              !env.ATOMICWORK_PROXY_TARGET ||
              !env.ATOMICWORK_API_KEY ||
              !ticketsPathTemplate ||
              !req.url?.startsWith('/api/tickets')
            ) {
              console.log('[v0] Skipping proxy - conditions not met');
              next();
              return;
            }

            try {
              const incomingUrl = new URL(req.url, 'http://localhost');
              const pageNumber = incomingUrl.searchParams.get('page') ?? env.VITE_TICKETS_PAGE_START ?? '1';
              const targetPath = ticketsPathTemplate.replace(/\{pagenumber\}/g, pageNumber);
              const requestBody = await new Promise<string>((resolve, reject) => {
                const chunks: Buffer[] = [];

                req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                req.on('error', reject);
              });

              const upstreamResult = await proxyAtomicworkRequest(
                env.ATOMICWORK_PROXY_TARGET,
                targetPath,
                env.ATOMICWORK_API_KEY,
                req,
                ['GET', 'HEAD'].includes(req.method ?? 'GET') ? '' : requestBody,
              );

              res.statusCode = upstreamResult.statusCode;
              res.setHeader('Content-Type', upstreamResult.contentType || 'application/json');
              res.end(upstreamResult.body);
            } catch (error) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  message: error instanceof Error ? error.message : 'Atomicwork proxy failed.',
                }),
              );
            }
          });
        },
      },
    ],
    test: {
      environment: 'node',
    },
  };
});
