import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Sleutels uit .env of .env.local. Zonder VITE_-voorvoegsel, dus ze komen nooit in de browsercode.
  const env = loadEnv(mode, process.cwd(), '');
  if (!env.API_NINJAS_KEY) console.warn('\n⚠  API_NINJAS_KEY ontbreekt in .env: het weer laadt niet.\n');
  if (!env.GRAPHHOPPER_KEY) console.warn('\n⚠  GRAPHHOPPER_KEY ontbreekt in .env: routes laden niet.\n');

  // /api/weather → https://api.api-ninjas.com/v1/weather, met de sleutel als header
  const proxy = {
    '/api/weather': {
      target: 'https://api.api-ninjas.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/weather/, '/v1/weather'),
      headers: { 'X-Api-Key': env.API_NINJAS_KEY ?? '' },
    },
    // /api/route → https://graphhopper.com/api/1/route?key=…  (GraphHopper verwacht de sleutel in de URL)
    '/api/route': {
      target: 'https://graphhopper.com',
      changeOrigin: true,
      rewrite: (path) => {
        const [, query = ''] = path.split('?');
        const params = new URLSearchParams(query);
        params.set('key', env.GRAPHHOPPER_KEY ?? '');
        return `/api/1/route?${params}`;
      },
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { host: true, proxy }, // ook bereikbaar vanaf je gsm op hetzelfde netwerk
    preview: { proxy },
  };
});
