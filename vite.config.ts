import { defineConfig } from 'vite';

// Only `public/` and the bundled `src/` are published. `referensiasset/` (source sheets, tens of MB)
// stays a design reference and is never copied into `dist/`.
export default defineConfig({
  build: {
    // Phaser rarely changes: a separate chunk lets browsers keep it cached across game updates.
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 0,
  },
});
