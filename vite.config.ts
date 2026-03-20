import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const execFileAsync = promisify(execFile);

function proxyAtomicworkRequest(
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

  return execFileAsync('curl', [
    '-sS',
    '-X',
    req.method ?? 'GET',
    '-H',
    `Content-Type: ${req.headers['content-type']?.toString() || 'application/json'}`,
    '-H',
    `x-api-key: ${apiKey}`,
    '--data',
    body,
    '-w',
    '\n%{http_code}\n%{content_type}',
    targetUrl.toString(),
  ]).then(({ stdout }) => {
    const lines = stdout.split('\n');
    const contentType = lines.pop() || 'application/json';
    const statusCode = Number(lines.pop() || '502');
    const responseBody = lines.join('\n');

    return {
      statusCode,
      contentType,
      body: responseBody,
    };
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ticketsPathTemplate = env.ATOMICWORK_TICKETS_PATH ?? '';

  return {
    plugins: [
      react(),
      {
        name: 'atomicwork-dev-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (
              !env.ATOMICWORK_PROXY_TARGET ||
              !env.ATOMICWORK_API_KEY ||
              !ticketsPathTemplate ||
              !req.url?.startsWith('/api/tickets')
            ) {
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
