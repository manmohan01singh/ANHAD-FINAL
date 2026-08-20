# CLAUDE.md — ANHAD Desktop UX, Responsiveness & Reliability Directive

## Mission

You are working on **ANHAD**, a Gurbani-focused web application.

The objective is not to make small cosmetic patches. The objective is to bring the application to a **high-quality, production-grade desktop/laptop browser experience** with strong visual hierarchy, symmetry, responsiveness, performance, and reliable audio playback.

The execution must be **plan-first, repository-aware, evidence-driven, and iterative**.

Do not claim something is fixed until you have actually inspected the relevant code, implemented the change, and verified the result.

---

# 1. NON-NEGOTIABLE PRIORITIES

Work in this exact priority order:

### P0 — Home / `index.html`
Make the main Home page the benchmark for the entire application.

It must feel deliberate, balanced, premium, calm, and highly structured on:

- 1024px laptop widths
- 1280px desktop
- 1366px desktop
- 1440px desktop
- 1536px desktop
- 1920px desktop / TV browser

The current Home page has visible problems such as:

- excessive empty space
- weak horizontal composition
- inconsistent card sizing
- content that does not feel optically centered
- background treatment that competes with content
- uneven section widths
- navigation/content balance issues
- visual density that changes badly between laptop and large desktop
- insufficiently disciplined spacing
- inconsistent typography hierarchy

Solve these at the system/layout level, not with random one-off pixel patches.

### P1 — Global desktop design system

After Home is stable, establish reusable desktop behavior for:

- page container widths
- main content centering
- sidebar/content relationship
- section spacing
- cards
- grids
- headings
- controls
- empty states
- image ratios
- modal/dialog behavior
- responsive breakpoints
- overflow behavior

Reuse existing components/classes where possible.

Do not create five different implementations of the same layout pattern.

### P2 — Gurbani Radio reliability

The radio/audio system must survive real-world network interruptions.

Required behavior:

1. User presses Play.
2. Audio begins.
3. Network disappears.
4. Playback stops/fails naturally.
5. The application remembers that the user intended playback.
6. The system enters reconnect mode.
7. It retries automatically.
8. When network access and stream availability return, playback resumes automatically.
9. The user must NOT have to press Play again.
10. Repeated failures must not create duplicate audio elements, timers, event handlers, or overlapping reconnect loops.

This must work on:

- laptop browsers
- desktop browsers
- TV/large-screen browsers where practical

Do not rely exclusively on `window.online`.

Use robust state management and defensive recovery.

### P3 — Mini-player

The mini-player has a known bug in Nitnem/Bani reader pages where it can degrade into essentially an image-only strip at the bottom/end of the page.

Fix the mini-player properly for:

- desktop
- mobile

Do not merely reposition it with a large `z-index`.

Verify:

- artwork
- title
- station/stream
- play/pause
- progress/live state where applicable
- close/minimize behavior
- responsive dimensions
- safe-area behavior on mobile
- no horizontal overflow
- no accidental overlap with reading controls
- no duplicated mini-player instances after navigation

There must be one reliable player architecture, not page-specific copies.

### P4 — All remaining desktop pages

Only after Home, global desktop system, radio reliability, and mini-player are stable:

Audit all pages for desktop responsiveness and visual quality.

At minimum check:

- Dashboard
- Nitnem Hub
- Nitnem/Bani Readers
- Gurbani Radio
- Daily Hukamnama
- Gurbani Khoj
- Sehaj Paath
- Naam Abhyas
- Sadhsangat Live
- Favorites
- Spiritual Notes
- Learning & Library
- Calendar
- Settings
- other existing routes discovered in the repository

Do not assume a page is fine because it renders.

---

# 2. CRITICAL CONSTRAINT: MOBILE PRESERVATION

The primary design target is **desktop/laptop browser**.

Do NOT rewrite mobile layouts unnecessarily.

Treat existing mobile behavior as protected.

### Allowed mobile changes

Only make mobile changes when they are required to fix a verified defect, especially:

- mini-player broken behavior
- audio reliability
- a shared component bug affecting both form factors
- severe overflow/regression

For unrelated desktop changes:

- keep them inside desktop media queries
- use desktop-specific layout classes
- avoid changing global mobile dimensions
- avoid changing mobile typography unless necessary
- avoid changing mobile navigation/gestures
- avoid changing mobile spacing unless a shared bug forces it

Desktop improvements should not become mobile regressions.

---

# 3. GURBANI GPT REMOVAL

Remove Gurbani GPT from the product completely.

This is a product decision, not merely a visual hide.

Search the repository for:

- navigation items
- routes
- imports
- components
- CSS
- JS
- event listeners
- API calls
- modals
- settings
- sidebars
- footer links
- lazy-loading hooks
- dead assets
- tests
- analytics events

Remove obsolete production code where it is safe.

Do not leave a dead route that users can still discover.

If a related feature currently appears in the interface and a temporary replacement is needed, use a clean:

**Coming Soon**

interaction.

### Coming Soon behavior

When clicked:

- do not navigate
- do not load a dead route
- show a polished modal/dialog
- explain briefly that the feature is coming soon
- provide a clear Close action
- keep the interaction keyboard accessible
- support Escape
- trap focus where appropriate
- avoid blocking the rest of the application after close

Keep this implementation reusable for future unavailable features.

---

# 4. HOME PAGE DESIGN STANDARD

The Home page must be treated as a flagship screen.

Do NOT just "make it responsive."

Make it **optically balanced**.

## Layout principles

Use:

- a predictable maximum content width
- a strong vertical rhythm
- consistent left/right gutters
- aligned section edges
- controlled card widths
- stable image aspect ratios
- consistent corner radius
- restrained shadows
- subtle elevation
- strong but calm hierarchy
- whitespace that communicates structure rather than emptiness

Avoid:

- random margins
- random negative margins
- excessive absolute positioning
- huge blank zones
- elements that appear centered mathematically but not optically
- inconsistent card heights
- oversized hero areas
- decorative effects that reduce readability
- overuse of gradients/glows
- unnecessary animations
- visual noise

## Desktop composition

At laptop width, prioritize:

1. sidebar
2. useful content density
3. hero
4. primary live content
5. Gurpurab/event content
6. practice
7. quick access
8. additional content

At larger screens, expand gracefully without allowing everything to become excessively wide.

Do not simply stretch a 1200px design to 1920px.

Use a sensible max-width.

---

# 5. SIDEBAR

The desktop sidebar should feel like a stable application navigation system.

Requirements:

- fixed/sticky where the existing architecture supports it
- never overlap page content
- no horizontal overflow
- navigation list can scroll independently if required
- footer actions remain reachable
- active route is visually obvious
- spacing is consistent
- labels remain readable
- sidebar width is stable
- page content should calculate its available width based on sidebar width

Do not rely on magic numbers scattered across multiple files.

Create reusable layout variables if the project architecture supports them.

---

# 6. BACKGROUND

The current background treatment has caused visual problems.

Desktop background should be:

- clean
- subtle
- low-noise
- high-contrast enough for readable content
- supportive of Gurbani imagery without competing with it

Do not use a stretched/blurred background image simply because it fills the viewport.

If the existing background asset is not contributing positively:

- remove it, or
- constrain it carefully, or
- replace it with a restrained surface/gradient system

Do not destroy readability for decorative ambience.

---

# 7. IMAGE RULES

Images must preserve intentional aspect ratios.

Never allow:

- distorted Guru Sahib imagery
- stretched thumbnails
- inconsistent crop behavior between cards
- bizarre object-fit behavior
- portrait artwork becoming compressed into landscape boxes

For repeated cards, use a shared image ratio.

For hero/live cards, use a consistent aspect ratio unless the content explicitly requires another shape.

---

# 8. RESPONSIVE DESKTOP BREAKPOINT STRATEGY

Do not design only for one screen width.

Test at least:

### Laptop
- 1024
- 1152
- 1280
- 1366

### Desktop
- 1440
- 1536
- 1680
- 1920

### Large/TV browser
- 2560 where practical

The layout should interpolate naturally between these.

Do not create a breakpoint for every single width.

Prefer a small number of meaningful layout ranges.

Example strategy (adjust according to actual repository architecture):

- `<1024px`: preserve existing mobile/tablet behavior
- `1024–1279px`: compact desktop/laptop
- `1280–1535px`: standard desktop
- `1536px+`: wide desktop

Do not blindly copy this if the application's existing breakpoints imply a better model. Inspect first.

---

# 9. PERFORMANCE REQUIREMENTS

Visual improvement must not come at the expense of performance.

Avoid:

- large synchronous scripts
- unnecessary DOM duplication
- expensive continuous animations
- repeated IntersectionObservers for identical purposes
- repeated network requests
- duplicate audio elements
- unnecessary polling
- giant box-shadow stacks
- full-screen blur filters
- expensive background attachment effects

Preserve or improve:

- LCP
- CLS
- INP
- time to interactive
- perceived responsiveness

Lazy-load content that does not need to exist immediately.

Do not lazy-load above-the-fold critical content.

---

# 10. AUDIO ENGINE — ROBUSTNESS SPECIFICATION

Inspect the actual audio architecture before changing it.

Identify:

- singleton
- HTMLAudioElement
- stream manager
- mini-player
- Media Session
- retry logic
- network listeners
- visibility handling
- route/navigation handling
- error/stall handling

The system should have explicit states, for example:

- idle
- loading
- playing
- paused
- stalled
- reconnecting
- unavailable
- stopped
- failed

The exact names can follow the repository's conventions.

## Critical invariant

If:

`wantsPlayback === true`

then temporary network failure must NOT permanently destroy the playback intent.

The engine must keep trying until:

- user explicitly presses Pause/Stop, or
- the stream is intentionally disabled by the product

Do not retry forever after an explicit user stop.

## Backoff

Use bounded adaptive backoff.

For example:

2s → 4s → 8s → 12s → 15s → 15s...

Add jitter if appropriate to reduce synchronized retry storms.

Do not create multiple overlapping retry timers.

## Watchdog

A watchdog is allowed, but keep it efficient.

Do not make an unnecessary network request every few seconds forever without considering browser constraints and battery/CPU.

Prefer event-driven recovery and only use probing when it materially improves recovery reliability.

## Browser constraints

Respect browser autoplay policy.

If the browser requires a user gesture before first playback, do not attempt to bypass that restriction.

The requirement is:

**after the user has intentionally started playback once, temporary network loss should recover automatically whenever browser policy permits.**

---

# 11. MINI-PLAYER ARCHITECTURE

The mini-player must be driven by shared playback state.

Do not duplicate player state across pages.

Navigation must not create another audio engine.

Navigation must not:

- reset playback unnecessarily
- destroy audio when route changes
- duplicate event listeners
- duplicate Media Session actions

The mini-player should render from the single source of truth.

---

# 12. CODEBASE FIRST — DO NOT GUESS

Before editing:

1. Inspect repository structure.
2. Identify the actual frontend entry points.
3. Read `index.html`.
4. Read its linked CSS/JS.
5. Locate the desktop responsive CSS.
6. Locate the audio singleton/engine.
7. Locate the mini-player.
8. Locate route/page architecture.
9. Search for Gurbani GPT references.
10. Search for duplicate responsive rules.
11. Search for fixed/absolute layouts likely causing overflow.
12. Search for body/background pseudo-elements.
13. Search for duplicated audio/event listeners.

Do not assume filenames from this document are correct.

Use the actual repository.

---

# 13. PLAN BEFORE EDITING

Before making broad changes, produce a compact internal execution plan with:

- files to inspect
- root cause
- intended fix
- risk
- verification method

Then execute.

Do not spend the whole task rewriting architecture without first confirming the current implementation.

---

# 14. CHANGE STRATEGY

Prefer:

### First
Smallest root-cause fix.

### Then
Shared reusable solution.

### Then
Visual refinement.

### Then
Cross-page verification.

Do not patch symptoms repeatedly.

If three pages have the same alignment problem, fix the shared layout system.

If three pages have different bugs, do not force them into one universal abstraction just to reduce file count.

---

# 15. HOME PAGE COMPONENT AUDIT

Inspect and improve every visible Home component.

At minimum:

### Header / top utility region
- optical centering
- sensible vertical footprint
- clean controls
- no excessive empty space

### Hero / central spiritual identity
- clear focal point
- intentional title hierarchy
- correct Gurmukhi rendering
- readable English translation
- stable image cluster
- no visual competition from background

### Today's Nitnem
- clear progress indicator
- aligned bar
- readable count
- no excessive width

### Live / content cards
- consistent card dimensions
- consistent typography
- consistent action controls
- clean badges
- correct artwork
- stable hover behavior
- no layout shift

### Gurpurab feature card
- balanced split
- clean artwork
- readable date/countdown
- strong CTA
- no unnecessary decoration

### Your Practice
- consistent three-card geometry
- equal heights
- centered icon/title/subtitle
- no random vertical drift

### Quick Access
- consistent grid
- reusable card component
- no cramped lower section
- consistent icons
- correct wrapping at laptop widths

---

# 16. OPTICAL SYMMETRY STANDARD

Do not judge symmetry solely by equal CSS values.

Inspect visually.

A design can have:

`margin-left = margin-right`

and still look off-center.

Pay attention to:

- text block weight
- artwork visual weight
- icon placement
- whitespace
- card density
- sidebar width
- long labels
- asymmetric artwork

Use the visual center, not merely the mathematical center.

---

# 17. ACCESSIBILITY

Do not sacrifice usability for aesthetics.

Verify:

- semantic buttons
- keyboard access
- visible focus
- readable contrast
- `aria-label` where needed
- dialog semantics
- Escape behavior
- proper heading order
- no mouse-only interactions

Avoid unnecessary motion.

Respect reduced-motion preference where the application already has animation.

---

# 18. TESTING / VERIFICATION

After implementation:

### Functional
- all major links/routes work
- no console errors
- no broken imports
- no missing assets
- no dead buttons
- no duplicate players

### Layout
Test desktop widths listed above.

Look for:

- horizontal scroll
- clipped text
- oversized cards
- collapsed grids
- awkward whitespace
- content touching viewport edges
- sidebar overlap
- sticky footer overlap
- fixed element collisions

### Audio
Perform/mentally verify:

1. Start stream.
2. Lose network.
3. Wait.
4. Restore network.
5. Confirm automatic recovery.
6. Navigate pages during reconnect.
7. Confirm playback intent persists.
8. Pause manually.
9. Confirm reconnect stops after explicit pause.
10. Confirm only one audio instance remains.

### Mini-player
Verify:

- Home
- Radio
- Nitnem reader
- another reading/content page
- navigation while playing
- refresh behavior according to existing product intent

---

# 19. NEVER DO THESE THINGS

Do NOT:

- rewrite the entire application unnecessarily
- touch mobile layout indiscriminately
- add huge JS frameworks for simple layout problems
- duplicate the audio engine
- add a second player singleton
- hide errors instead of fixing them
- use `!important` everywhere
- use arbitrary negative margins as the main layout strategy
- use `position:absolute` for major page structure
- permanently poll every few seconds without justification
- remove accessibility for visual simplicity
- fake test results
- claim completion without inspection/verification
- delete user functionality merely because it is difficult to fix
- remove existing functionality unless explicitly requested or clearly obsolete
- overwrite unrelated code

---

# 20. DEFINITION OF DONE

The task is complete only when:

## Home
- [ ] Home is visually excellent on laptop and desktop
- [ ] Main content is optically centered
- [ ] grids are balanced
- [ ] background is clean
- [ ] no obvious empty dead zones
- [ ] no horizontal overflow
- [ ] imagery is consistent
- [ ] typography hierarchy is disciplined
- [ ] desktop feels like a coherent application, not a stretched webpage

## Gurbani GPT
- [ ] removed from navigation/product
- [ ] dead routes/imports cleaned where safe
- [ ] no broken references remain
- [ ] replacement unavailable features use Coming Soon modal where appropriate

## Radio
- [ ] network-loss recovery works
- [ ] playback intent persists
- [ ] reconnect is bounded/adaptive
- [ ] no duplicate retry loops
- [ ] no duplicate audio elements
- [ ] explicit Pause cancels recovery

## Mini-player
- [ ] fully functional on desktop
- [ ] fully functional on mobile
- [ ] no image-only failure
- [ ] no duplicate player instances
- [ ] navigation does not break the player

## All desktop pages
- [ ] centered where intended
- [ ] responsive
- [ ] no horizontal overflow
- [ ] no obvious clipping
- [ ] no major alignment defects
- [ ] consistent design system

## Quality
- [ ] console clean of newly introduced errors
- [ ] assets load correctly
- [ ] no obvious performance regression
- [ ] desktop changes did not unintentionally damage mobile

---

# 21. EXECUTION STYLE

Be aggressive about quality, but conservative about unnecessary architectural churn.

Think like:

- product designer
- frontend architect
- performance engineer
- QA engineer
- audio/realtime systems engineer

Do not stop at "it renders."

The standard is:

**looks right + behaves right + survives real usage + does not regress mobile + remains maintainable.**

When a defect is discovered during verification, fix the root cause before continuing.

The Home page is the benchmark.

---

# 22. FINAL REPORT FORMAT

When finished, report:

1. What was actually changed.
2. Which files were changed.
3. Which root causes were fixed.
4. Which desktop widths were verified.
5. What was verified for audio recovery.
6. What was verified for mini-player.
7. What was removed for Gurbani GPT.
8. Any remaining known issue.
9. Do not claim visual verification at a screen width you did not actually inspect.

Be factual. No inflated claims.

