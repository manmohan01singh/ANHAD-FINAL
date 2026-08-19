module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js'],
  // Without these, `**/*.test.js` also matches the Capacitor web-asset mirrors —
  // android/app/src/main/assets/public/ and ios/App/App/public/ are full copies
  // of frontend/, plus two android build-intermediate copies. Jest would collect
  // and run the same sadhsangat suites four times over. (vitest.config.js already
  // excludes android/** and ios/**; this brings Jest in line.)
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/dist-electron/',
    '<rootDir>/scratch/',
    // Deliberately-failing exploration suites — see vitest.config.js `exclude`.
    'bug-exploration',
    '<rootDir>/frontend/js/theme-rendering.test.js',
  ],
  collectCoverageFrom: [
    'frontend/**/*.js',
    '!frontend/**/node_modules/**',
    '!frontend/**/vendor/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000, // Longer timeout for property-based tests
};
