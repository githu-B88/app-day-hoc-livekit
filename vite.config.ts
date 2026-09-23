import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const livekitUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    process.env.LIVEKIT_URL ||
    process.env.VITE_LIVEKIT_URL ||
    'wss://eduwhite-i0qhtq4t.livekit.cloud';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.NEXT_PUBLIC_LIVEKIT_URL': JSON.stringify(livekitUrl),
      'process.env.LIVEKIT_URL': JSON.stringify(livekitUrl),
      'process.env.VITE_LIVEKIT_URL': JSON.stringify(livekitUrl),
      'import.meta.env.VITE_LIVEKIT_URL': JSON.stringify(livekitUrl),
      'import.meta.env.NEXT_PUBLIC_LIVEKIT_URL': JSON.stringify(livekitUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
