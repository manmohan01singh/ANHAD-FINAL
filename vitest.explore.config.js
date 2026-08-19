import { defineConfig } from 'vitest/config';
import base from './vitest.config.js';

/**
 * Runs ONLY the deliberately-failing exploration suites.
 *
 * These files document known-unfixed defects and are written to fail against
 * current code — frontend/js/theme-rendering.test.js states it outright in its
 * header ("This test is EXPECTED TO FAIL on unfixed code to confirm the bugs
 * exist. DO NOT fix the test or implementation when it fails").
 *
 * They are valuable as documentation, but leaving them in the default run made
 * `npm test` permanently red, so a genuine regression had nowhere to show. The
 * default run excludes them; this config is how you look at them on purpose:
 *
 *     npm run test:explore
 *
 * Expect failures here. That is the point.
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: [
      '**/*bug-exploration*.test.js',
      'frontend/js/theme-rendering.test.js',
    ],
    exclude: [
      'node_modules/**',
      'backend/node_modules/**',
      'android/**',
      'ios/**',
      'dist-electron/**',
      'scratch/**',
      'frontend/sadhsangat-live/node_modules/**',
    ],
  },
});
