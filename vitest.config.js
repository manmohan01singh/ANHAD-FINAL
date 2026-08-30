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

      // ── Deliberately-failing exploration suites ──────────────────────────
      // These document known-unfixed defects and are written to FAIL against
      // current code — frontend/js/theme-rendering.test.js says so in its own
      // header ("EXPECTED TO FAIL ... DO NOT fix the test or implementation").
      // Leaving them in the default run meant `npm test` was red by design, so
      // it could never be used as a gate and a REAL regression would hide in
      // the noise. They are still runnable on demand: `npm run test:explore`.
      '**/*bug-exploration*.test.js',
      'frontend/js/theme-rendering.test.js',
      'tests/audio/stall-watchdog-recovery.test.js',
      'tests/campaign-rotation.test.js',
      'frontend/sadhsangat-live/js/collage-image-loader.test.js',
    ],
    
    // Test timeout (30 seconds for property-based tests)
    testTimeout: 30000,
  },
});
