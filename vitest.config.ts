import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'electron'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'electron/',
        'src/test/',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'eslint.config.js',
      ],
      thresholds: {
        // Set reasonable thresholds - can increase as coverage improves
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  },
});
