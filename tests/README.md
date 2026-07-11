# ANHAD Test Structure

This directory contains all tests for the ANHAD application, organized by feature area.

## Directory Structure

```
tests/
├── audio/                    # Virtual Live Streaming System tests
│   ├── timeline.test.js      # Timeline calculation tests
│   ├── pause-resume.test.js  # Pause/resume behavior tests
│   ├── sync.test.js          # UI synchronization tests
│   ├── transitions.test.js   # Track transition tests
│   └── state-recovery.test.js # State recovery tests
│
├── mini-player/              # Mini Player tests
│   ├── persistence.test.js   # State persistence tests
│   └── navigation.test.js    # Navigation and controls tests
│
├── naam-abhyas/              # Naam Abhyas (meditation) tests
│   ├── notifications.test.js # Notification system tests
│   └── scheduler.test.js     # Schedule management tests
│
├── nitnem/                   # Nitnem (daily prayers) tests
│   └── font-update.test.js   # Font rendering tests
│
└── integration/              # Integration tests
    ├── navigation.test.js    # Cross-feature navigation tests
    └── media-session.test.js # Media Session API integration tests
```

## Test Types

### Unit Tests
- Test individual functions and modules in isolation
- Located in feature-specific directories (audio/, mini-player/, etc.)
- Fast execution, focused on single responsibilities

### Property-Based Tests
- Use fast-check to generate test cases
- Test invariants and properties that should always hold
- Example: timeline calculations, state transitions

### Integration Tests
- Test interactions between multiple components
- Located in `integration/` directory
- Test end-to-end workflows

## Running Tests

### All Tests
```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode
npm run test:ui             # Interactive UI
npm run test:coverage       # Generate coverage report
```

### Specific Test Suites
```bash
npm test tests/audio                    # All audio tests
npm test tests/audio/timeline.test.js   # Specific test file
npm test tests/integration              # All integration tests
```

### Jest (Legacy - Being Migrated)
```bash
npm run test:jest           # Run existing Jest tests
npm run test:jest:watch     # Jest watch mode
npm run test:jest:coverage  # Jest coverage
```

## Writing Tests

### Test File Naming
- Unit tests: `feature-name.test.js`
- Property-based tests: Include "property" or "pbt" in description
- Integration tests: `feature-integration.test.js`

### Test Structure
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check'; // For property-based testing

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Unit test
    expect(result).toBe(expected);
  });

  it('property: should maintain invariant', () => {
    // Property-based test
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return invariantHolds(n);
      })
    );
  });
});
```

## Test Guidelines

### For Virtual Live Streaming
- Always test timeline calculation accuracy
- Verify pause anchor preservation
- Check UI synchronization across all components
- Test track transitions start at 00:00
- Verify state recovery after various events

### For Mini Player
- Test persistence across navigation
- Verify state synchronization with main player
- Test media controls integration

### For Naam Abhyas
- Test notification scheduling and delivery
- Verify timer accuracy
- Test state persistence

### For Nitnem
- Test font rendering and updates
- Verify reading progress tracking
- Test navigation between banis

### For Integration Tests
- Test cross-feature workflows
- Verify Media Session API integration
- Test service worker communication
- Verify notification interactions

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Makes tests resilient to refactoring

2. **Use Property-Based Testing for Complex Logic**
   - Timeline calculations
   - State transitions
   - Data transformations

3. **Mock External Dependencies**
   - Browser APIs (already mocked in vitest.setup.js)
   - Network requests
   - Time-dependent operations

4. **Keep Tests Fast**
   - Unit tests should run in milliseconds
   - Integration tests can take longer
   - Use appropriate timeouts

5. **Write Descriptive Test Names**
   - Good: "should display '10 seconds behind live' after 10-second pause"
   - Bad: "test pause behavior"

6. **Test Edge Cases**
   - Empty inputs
   - Boundary values
   - Error conditions
   - Race conditions

## Migration from Jest

When migrating an existing Jest test to Vitest:

1. Move test file to appropriate directory in `tests/`
2. Update imports:
   ```javascript
   // Old (Jest)
   // No imports needed, Jest globals

   // New (Vitest)
   import { describe, it, expect, vi } from 'vitest';
   ```

3. Update mocks:
   ```javascript
   // Old (Jest)
   jest.fn()
   jest.mock()
   jest.clearAllMocks()

   // New (Vitest)
   vi.fn()
   vi.mock()
   vi.clearAllMocks()
   ```

4. Run the test to verify it passes
5. Delete the old Jest test file

## Coverage Goals

- **Critical paths**: 100% coverage (audio playback, timeline calculations)
- **Feature modules**: 80%+ coverage
- **Integration tests**: Cover major user workflows
- **Overall project**: Target 70%+ coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Library](https://testing-library.com/)
- Project-specific: `../VITEST_SETUP.md`
