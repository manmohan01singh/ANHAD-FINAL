import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for browser environment simulation
    environment: 'jsdom',
    
    // Global test configuration
    globals: true,
    
    // Setup files to run before each test file
    setupFiles: ['./vitest.setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'backend/**',
        'android/**',
        'ios/**',
        'dist-electron/**',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
      ],
    },
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'backend/node_modules/**',
      'android/**',
      'ios/**',
      'dist-electron/**',
      'scratch/**',
      'frontend/sadhsangat-live/node_modules/**',
    ],
    
    // Test timeout (30 seconds for property-based tests)
    testTimeout: 30000,
  },
});
