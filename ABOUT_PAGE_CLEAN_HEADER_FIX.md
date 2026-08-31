# About Page - Clean Header Fix

## The Problem
The about page is showing a red/coral colored header bar instead of the dynamic island pill design.

## Root Cause
There are multiple CSS files being loaded that contain conflicting navigation styles:
- `trendora-premium.css`
- `anhad-core.css`
- `claymorphism-system.css`  
- `nav-glass.css`

These files contain styles for `.glass-nav` that create the full-width header with the red bar background.

## Solution
Remove the conflicting stylesheets and keep ONLY:
1. `theme-variables.css` (for theme support)
2. `legal-shared.css` (for page content styling)
3. Inline styles for the dynamic island (cannot be overridden)

## Files To Update
1. `frontend/about/index.html` - Remove extra CSS links
2. `frontend/Journey/journey.html` - Remove extra CSS links

## Commands to Fix
Run these from the ANHAD-FINAL directory:

```bash
# The red bar is coming from external CSS files
# We need to stop loading them for the about and journey pages
```

The dynamic island should be self-contained with inline styles only.
