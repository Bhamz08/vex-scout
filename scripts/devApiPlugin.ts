import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';

type Handler = (request: Request) => Promise<Response>;

/**
 * Dev-only: serves /api/* from the same function files Vercel deploys (api/vex/[...path].ts,
 * api/world-skills.ts), so `npm run dev` can use live data without `vercel dev`.
 * Server-only env vars (VEX_API_KEY, …) are loaded into this Node process and never sent to the client;
 * Vite only exposes VITE_-prefixed variables to the browser bundle.
 */
export function devApiPlugin(): Plugin {
  return {
    name: 'vex-scout-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const key of ['VEX_API_KEY', 'VEX_API_BASE', 'VEX_WORLD_SKILLS_URL']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '';
        const file = url.startsWith('/api/vex/') ? '/api/vex/[...path].ts' : url.startsWith('/api/world-skills') ? '/api/world-skills.ts' : null;
        if (!file) return next();
        try {
          const mod = (await server.ssrLoadModule(file)) as { GET: Handler };
          const response = await mod.GET(new Request(`http://localhost${url}`, { method: req.method ?? 'GET' }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'dev_proxy_failed', message: String(error) }));
        }
      });
    },
  };
}
