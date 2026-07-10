module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'frontend/**/*.js',
    '!frontend/**/node_modules/**',
    '!frontend/**/vendor/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000, // Longer timeout for property-based tests
};
