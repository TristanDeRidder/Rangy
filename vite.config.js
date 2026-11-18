import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true }, // ook bereikbaar vanaf je gsm op hetzelfde netwerk
});
