# Preservation Property Tests - Task 2

## Overview

This directory contains **preservation property tests** for the Virtual Live Streaming Stabilization bugfix. These tests verify that non-buggy functionality remains unchanged after the fix is implemented.

**Created**: Task 2 of bugfix workflow  
**Status**: ✅ All 57 tests PASSING on unfixed code (as expected)  
**Methodology**: Observation-first approach - tests capture current working behavior

## Test Files

### 1. preservation-darbar-live.test.js
**Validates**: Requirements 3.1, 3.2  
**Tests**: 10 property tests  
**Coverage**: Darbar Sahib Live (real live) stream functionality

- ✅ Stream URL loads correctly
- ✅ Playback starts correctly
- ✅ Controls (play/pause/volume) respond correctly
- ✅ No timeline calculations for real live streams
- ✅ Buffering handled gracefully
- ✅ Volume control works for all valid values (property-based)
- ✅ Auto-resume after page refresh
- ✅ Metadata displays correctly
- ✅ Stays at live edge (no seeking backwards)
- ✅ Bypasses virtual live sync APIs

### 2. preservation-basic-playback.test.js
**Validates**: Requirements 3.3, 3.4, 3.5  
**Tests**: 15 property tests  
**Coverage**: Basic playback controls (start, volume, stop)

- ✅ Starting playback initiates audio correctly
- ✅ Volume controls adjust volume correctly
- ✅ Stop button stops audio correctly
- ✅ Volume accepts all valid values 0.0-1.0 (property-based)
- ✅ Audio element lifecycle events fire correctly
- ✅ Play/pause toggle works correctly
- ✅ Audio source can be changed
- ✅ Volume persists across pause/play cycles
- ✅ currentTime advances during playback
- ✅ Audio can be stopped and restarted
- ✅ Playback rate can be adjusted 0.5-2.0 (property-based)
- ✅ Audio state persists to localStorage
- ✅ Multiple event listeners can be attached
- ✅ Audio can be loaded without playing
- ✅ Event listeners can be removed

### 3. preservation-playlist-looping.test.js
**Validates**: Requirements 3.6, 3.7  
**Tests**: 15 property tests  
**Coverage**: Playlist looping behavior

- ✅ Amritvela Kirtan loops from Track 40 to Track 1
- ✅ Waheguru Simran loops from Track 38 to Track 1
- ✅ Amritvela looping works for all tracks 0-39 (property-based)
- ✅ Simran looping works for all tracks 0-37 (property-based)
- ✅ Multiple loops work correctly
- ✅ Looping preserves audio state
- ✅ 'ended' event triggers looping logic
- ✅ Looping works at track end
- ✅ Track index never exceeds playlist bounds (property-based)
- ✅ Looping maintains playlist continuity
- ✅ Simran playlist has 38 tracks and loops correctly
- ✅ Amritvela playlist has 40 tracks and loops correctly
- ✅ Looping plays all tracks before repeating
- ✅ Looping handles edge case indices safely
- ✅ Playlist looping independent of timeline sync

### 4. preservation-other-functionality.test.js
**Validates**: Requirements 3.8, 3.9, 3.10, 3.11, 3.12  
**Tests**: 17 property tests  
**Coverage**: Buffering, navigation, stream switching, Media Session API, background playback

#### Audio Buffering (3.8)
- ✅ Network buffering handled gracefully
- ✅ Progress events fire during buffering
- ✅ Audio continues after buffering
- ✅ Network reconnect doesn't stop playback

#### Navigation and UI (3.9)
- ✅ Audio persists across page navigation
- ✅ Navigation doesn't interrupt playback

#### Stream Switching (3.10)
- ✅ Stream switching works correctly (Darbar/Amritvela/Simran)
- ✅ Multiple stream switches work (property-based)
- ✅ Stream switching preserves volume

#### Media Session API (3.11)
- ✅ Media Session metadata updates
- ✅ Media Session action handlers work
- ✅ Media Session playback state updates
- ✅ Media Session position state updates

#### Background Playback (3.12)
- ✅ Audio continues when app backgrounded
- ✅ Audio state preserved across visibility changes
- ✅ Audio survives multiple background cycles (property-based)
- ✅ Audio persists across all pages

## Test Results

```bash
npm test tests/audio/preservation
```

**Results**: ✅ 57 tests passing (4 test files)

```
 ✓ tests/audio/preservation-darbar-live.test.js (10 tests) 17ms
 ✓ tests/audio/preservation-basic-playback.test.js (15 tests) 121ms
 ✓ tests/audio/preservation-playlist-looping.test.js (15 tests) 16ms
 ✓ tests/audio/preservation-other-functionality.test.js (17 tests) 22ms
```

## Property-Based Testing

These tests use **fast-check** for property-based testing to generate many test cases:

- **Volume tests**: 50-100 random values between 0.0-1.0
- **Playlist looping**: 100 random track indices
- **Stream switching**: 50 random switch sequences
- **Background cycles**: 10-20 random background/foreground cycles

This provides strong guarantees that preserved functionality works across a wide range of inputs.

## Test Philosophy

### Observation-First Methodology

1. **Observe**: Examined current working behavior on UNFIXED code
2. **Capture**: Wrote tests that capture existing behavior patterns
3. **Validate**: Tests PASS on unfixed code (confirming baseline)
4. **Preserve**: Tests should ALSO PASS on fixed code (confirming no regression)

### Why These Tests Matter

- **Regression Prevention**: Ensures bugfixes don't break working features
- **Documentation**: Tests serve as executable specification of expected behavior
- **Confidence**: Developers can refactor safely knowing tests will catch breakage
- **Coverage**: 57 tests covering 12 preservation requirements (3.1-3.12)

## Next Steps

After Task 2 (this task):

1. **Task 3**: Implement the bugfix for virtual live streaming
2. **Task 4**: Re-run preservation tests to confirm no regression
3. **Task 5**: Run bug exploration tests to confirm bugs are fixed

## Requirements Coverage

| Requirement | Description | Tests | Status |
|-------------|-------------|-------|--------|
| 3.1 | Darbar Sahib Live timeline calculations | 10 | ✅ PASS |
| 3.2 | Darbar Sahib Live controls | 10 | ✅ PASS |
| 3.3 | Start playback | 15 | ✅ PASS |
| 3.4 | Volume controls | 15 | ✅ PASS |
| 3.5 | Stop playback | 15 | ✅ PASS |
| 3.6 | Amritvela playlist looping | 15 | ✅ PASS |
| 3.7 | Simran playlist looping | 15 | ✅ PASS |
| 3.8 | Audio buffering | 17 | ✅ PASS |
| 3.9 | Navigation and UI | 17 | ✅ PASS |
| 3.10 | Stream switching | 17 | ✅ PASS |
| 3.11 | Media Session API | 17 | ✅ PASS |
| 3.12 | Background playback | 17 | ✅ PASS |

**Total Coverage**: 12/12 preservation requirements validated

## Running Tests

### All preservation tests
```bash
npm test tests/audio/preservation
```

### Individual test files
```bash
npm test tests/audio/preservation-darbar-live.test.js
npm test tests/audio/preservation-basic-playback.test.js
npm test tests/audio/preservation-playlist-looping.test.js
npm test tests/audio/preservation-other-functionality.test.js
```

### Watch mode (for development)
```bash
npm run test:watch tests/audio/preservation
```

### With coverage
```bash
npm run test:coverage -- tests/audio/preservation
```

## Key Insights

### What We Learned

1. **Darbar Sahib Live** is completely separate from virtual live streams - it uses real HLS streaming with no timeline calculations
2. **Basic playback** is solid - volume, play/pause, stop all work correctly
3. **Playlist looping** uses simple modulo arithmetic - very reliable
4. **Buffering** is handled gracefully with proper event firing
5. **Navigation** doesn't interrupt playback - audio persists as singleton
6. **Media Session API** integration is working for lock screen controls
7. **Background playback** survives visibility changes and page navigation

### What Should NOT Be Affected by Bugfix

- Darbar Sahib Live stream functionality
- Basic audio element controls and properties
- Playlist looping logic (Track 40→1, Track 38→1)
- Network buffering and recovery
- Cross-page audio persistence
- Media Session API metadata and controls
- Background playback behavior

These are the boundaries of the bugfix - changes should be isolated to virtual live timeline calculations, pause/resume state, UI synchronization, track transitions, and state recovery.

## Maintenance

### When to Update These Tests

- ❌ **DO NOT** update when fixing virtual live bugs (tests should keep passing)
- ✅ **DO** update if intentionally changing preserved behavior
- ✅ **DO** add tests if new preservation requirements identified
- ✅ **DO** fix tests if they fail unexpectedly (indicates regression)

### Test Health Checks

Run these tests:
- ✅ Before implementing bugfix (should PASS)
- ✅ After implementing bugfix (should still PASS)
- ✅ After any refactoring (should still PASS)
- ✅ In CI/CD pipeline (continuous validation)

## Contact

For questions about these tests, see:
- `bugfix.md` - Requirements 3.1-3.12
- `design.md` - Preservation property specifications
- `tasks.md` - Task 2 details
