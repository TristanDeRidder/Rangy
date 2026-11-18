import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // API_NINJAS_KEY uit .env.local. Zonder VITE_-voorvoegsel, dus de sleutel komt nooit in de browsercode.
  const env = loadEnv(mode, process.cwd(), '');
  if (!env.API_NINJAS_KEY) console.warn('\n⚠  API_NINJAS_KEY ontbreekt in .env.local: het weer laadt niet.\n');

  // /api/weather → https://api.api-ninjas.com/v1/weather, met de sleutel als header
  const proxy = {
    '/api/weather': {
      target: 'https://api.api-ninjas.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/weather/, '/v1/weather'),
      headers: { 'X-Api-Key': env.API_NINJAS_KEY ?? '' },
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { host: true, proxy }, // ook bereikbaar vanaf je gsm op hetzelfde netwerk
    preview: { proxy },
  };
});
