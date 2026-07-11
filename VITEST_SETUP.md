# Vitest Testing Framework Setup

## Overview

The ANHAD project uses **Vitest** as its modern testing framework alongside Jest. Vitest provides fast test execution, excellent ESM support, and seamless integration with property-based testing. Jest tests are being gradually migrated to Vitest.

## Migration Strategy

**Vitest and Jest Coexist:**
- ✅ New tests → Use Vitest
- ✅ Existing tests → Keep running on Jest
- ✅ Gradual migration → Move tests over time
- ✅ Once stable → Remove Jest completely

This approach avoids breaking existing tests while moving forward with modern tooling.

## Stack

- **Vitest** → Test runner and assertion library
- **fast-check** → Property-based testing for generating test cases
- **jsdom** → Browser environment simulation for DOM testing
- **@testing-library/dom** → DOM interaction utilities (optional, installed but not required)

## Installation

All dependencies are already installed. If you need to reinstall:

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/dom fast-check
```

## Configuration

### vitest.config.js

The main configuration file with:
- **Environment**: jsdom (simulates browser environment)
- **Globals**: Enabled for convenience (no need to import `describe`, `it`, `expect`)
- **Setup file**: `vitest.setup.js` runs before each test file
- **Coverage**: Configured with v8 provider
- **Exclusions**: node_modules, backend, Android/iOS, build outputs

### vitest.setup.js

Global setup file that provides comprehensive PWA and audio app mocks:
- **Browser APIs**: ResizeObserver, IntersectionObserver, matchMedia
- **PWA APIs**: MediaSession, Notification, BroadcastChannel, Service Worker
- **Audio APIs**: Audio (HTMLAudioElement), AudioContext
- **Animation**: requestAnimationFrame, cancelAnimationFrame
- **Page Visibility**: document.hidden, document.visibilityState, navigator.onLine
- **Events**: CustomEvent
- **Storage**: localStorage, sessionStorage
- **Network**: fetch
- **Console**: Silenced by default (reduce test noise)

## Running Tests

```bash
# Vitest (New tests)
npm test                    # Run all Vitest tests once
npm run test:watch          # Watch mode (re-run on file changes)
npm run test:ui             # Interactive UI mode
npm run test:coverage       # Generate coverage report

# Jest (Existing tests - will be migrated)
npm run test:jest           # Run Jest tests
npm run test:jest:watch     # Jest watch mode
npm run test:jest:coverage  # Jest coverage report
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Property-Based Testing with fast-check

```javascript
import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Math Properties', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      })
    );
  });
});
```

### DOM Testing

```javascript
import { describe, it, expect } from 'vitest';

describe('DOM Tests', () => {
  it('should manipulate DOM', () => {
    document.body.innerHTML = '<div id="test">Hello</div>';
    const el = document.getElementById('test');
    expect(el.textContent).toBe('Hello');
  });
});
```

### Audio Testing

```javascript
import { describe, it, expect } from 'vitest';

describe('Audio Tests', () => {
  it('should create audio element', () => {
    const audio = new Audio('test.mp3');
    expect(audio.src).toContain('test.mp3');
    expect(audio.paused).toBe(true);
    
    audio.play();
    expect(audio.paused).toBe(false);
  });
});
```

## Test Location

Tests are organized in the `tests/` directory by feature area:

```
tests/
├── audio/                    # Virtual Live Streaming tests
│   ├── timeline.test.js
│   ├── pause-resume.test.js
│   ├── sync.test.js
│   ├── transitions.test.js
│   └── state-recovery.test.js
├── mini-player/              # Mini Player tests
├── naam-abhyas/              # Naam Abhyas tests
├── nitnem/                   # Nitnem tests
└── integration/              # Integration tests
```

See `tests/README.md` for complete structure and guidelines.

## Example Test

See `test/setup.test.js` for a complete example demonstrating:
- Basic assertions
- DOM environment verification
- Audio mock usage
- localStorage mock usage
- Property-based testing with fast-check

## Migration from Jest

If you have existing Jest tests, you'll need to migrate them:

1. **Remove Jest globals**:
   - Replace `jest.fn()` with `vi.fn()` (Vitest's mock function)
   - Replace `jest.mock()` with `vi.mock()`
   - Replace `jest.clearAllMocks()` with `vi.clearAllMocks()`

2. **Import Vitest utilities**:
   ```javascript
   import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
   ```

3. **Update mocks**:
   - Jest: `jest.fn()`
   - Vitest: `vi.fn()` or use the mocks already provided in `vitest.setup.js`

## Benefits Over Jest

- ⚡ **Faster**: Near-instant startup and execution
- 🔄 **Better watch mode**: Only re-runs affected tests
- 📦 **ESM native**: Better support for modern JavaScript modules
- 🎯 **Vite integration**: Shares configuration with Vite (if you add it later)
- 🧪 **Property-based testing**: fast-check integrates seamlessly

## Troubleshooting

### Tests can't find modules
- Ensure your test files use correct import paths
- Check `vitest.config.js` for alias configuration if needed

### DOM not available
- Verify `environment: 'jsdom'` is set in config
- Check that `vitest.setup.js` is loaded

### Audio mock not working
- Audio mock is provided in `vitest.setup.js`
- For advanced audio testing, you may need to customize the mock

## Property-Based Testing Best Practices

1. **Use for invariants**: Test properties that should always hold
2. **Let fast-check generate inputs**: Don't manually create test cases
3. **Keep properties simple**: Each property should test one invariant
4. **Use shrinking**: fast-check automatically simplifies failing cases

### Example Properties to Test

- **Commutativity**: `a + b === b + a`
- **Associativity**: `(a + b) + c === a + (b + c)`
- **Identity**: `a + 0 === a`
- **Idempotence**: `sort(sort(array)) === sort(array)`
- **Round-trip**: `decode(encode(x)) === x`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Library](https://testing-library.com/)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
