import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchSolarBodies } from './server/solarProxy';

function solarApiDevProxy(): Plugin {
  let apiToken: string | undefined;
  return {
    name: 'orbita-solar-api-dev-proxy',
    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      apiToken = env.SOLAR_API_TOKEN || process.env.SOLAR_API_TOKEN;
    },
    configureServer(server) {
      server.middlewares.use('/api/bodies', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');

        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'Método não permitido.' }));
          return;
        }

        if (!apiToken) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: 'Configure SOLAR_API_TOKEN para consultar a API Le Système Solaire.' }));
          return;
        }

        try {
          const result = await fetchSolarBodies(apiToken);
          response.statusCode = result.status;
          response.end(JSON.stringify(result.payload));
        } catch {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Não foi possível alcançar a API do Sistema Solar. Tente novamente.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), solarApiDevProxy()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
});
