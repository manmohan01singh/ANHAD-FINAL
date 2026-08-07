/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD TELEMETRY ENGINE v3.0 (Browser Runtime & Capacitor Device Suite)
 * 
 * Real-time Browser & Capacitor WebView Performance Profiler.
 * Classifies every metric strictly into:
 * - Directly Measured (Standard browser Performance APIs)
 * - Derived (Calculated from directly measured timestamps)
 * - Estimated (Approximations based on heuristics)
 * - Not Measured (Unavailable in current runtime context)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  if (window.AnhadPerf) return;

  const isBrowserRuntime = typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.requestAnimationFrame === 'function';

  const metrics = {
    runtimeContext: isBrowserRuntime ? (window.Capacitor ? 'Capacitor Android WebView' : 'Chrome Web Browser') : 'Non-Browser Context',
    startupPipeline: {
      navigationStart: { value: 0, classification: 'Directly Measured' },
      firstPaintMs: { value: 'Not Measured', classification: 'Not Measured' },
      firstContentfulPaintMs: { value: 'Not Measured', classification: 'Not Measured' },
      largestContentfulPaintMs: { value: 'Not Measured', classification: 'Not Measured' },
      firstInteractiveMs: { value: 'Not Measured', classification: 'Not Measured' }
    },
    mainThreadBudget: {
      longTaskCount: { value: 'Not Measured', classification: 'Not Measured' },
      maxSingleTaskMs: { value: 'Not Measured', classification: 'Not Measured' }
    },
    navigationP95: {
      totalSamples: 0,
      p50Ms: { value: 'Not Measured', classification: 'Not Measured' },
      p95Ms: { value: 'Not Measured', classification: 'Not Measured' },
      p99Ms: { value: 'Not Measured', classification: 'Not Measured' },
      latencies: []
    },
    fps: {
      current: { value: 'Not Measured', classification: 'Not Measured' },
      min: { value: 'Not Measured', classification: 'Not Measured' },
      frameDrops: { value: 'Not Measured', classification: 'Not Measured' }
    },
    memoryMB: {
      initialMB: { value: 'Not Measured', classification: 'Not Measured' },
      currentMB: { value: 'Not Measured', classification: 'Not Measured' },
      netGrowthPercent: { value: 'Not Measured', classification: 'Not Measured' }
    },
    listeners: {
      duplicateCount: { value: 0, classification: 'Directly Measured' },
      targetMap: new Map()
    }
  };

  // ── 1. BROWSER RUNTIME FPS & FRAME DROPS ──────────────────────────────────
  if (isBrowserRuntime) {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let minFps = 120;
    let frameDrops = 0;

    function trackFrame(now) {
      const delta = now - lastFrameTime;
      lastFrameTime = now;

      if (delta > 20) frameDrops++;

      frameCount++;
      if (now - fpsTimer >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - fpsTimer));
        minFps = Math.min(minFps, currentFps);

        metrics.fps.current = { value: currentFps, classification: 'Directly Measured' };
        metrics.fps.min = { value: minFps, classification: 'Directly Measured' };
        metrics.fps.frameDrops = { value: frameDrops, classification: 'Directly Measured' };

        frameCount = 0;
        fpsTimer = now;
      }
      requestAnimationFrame(trackFrame);
    }
    requestAnimationFrame(trackFrame);
  }

  // ── 2. PERFORMANCE OBSERVERS (Paint & Long Tasks) ───────────────────────
  if (isBrowserRuntime && 'PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            metrics.startupPipeline.firstPaintMs = { value: Math.round(entry.startTime), classification: 'Directly Measured' };
          }
          if (entry.name === 'first-contentful-paint') {
            metrics.startupPipeline.firstContentfulPaintMs = { value: Math.round(entry.startTime), classification: 'Directly Measured' };
          }
        }
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {}

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.startupPipeline.largestContentfulPaintMs = {
            value: Math.round(entries[entries.length - 1].startTime),
            classification: 'Directly Measured'
          };
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    try {
      let count = 0;
      let maxTask = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          count++;
          maxTask = Math.max(maxTask, Math.round(entry.duration));
        }
        metrics.mainThreadBudget.longTaskCount = { value: count, classification: 'Directly Measured' };
        metrics.mainThreadBudget.maxSingleTaskMs = { value: maxTask, classification: 'Directly Measured' };
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  }

  // ── 3. EVENT LISTENER LEAK & DUPLICATE TRACKING ───────────────────────────
  if (typeof EventTarget !== 'undefined') {
    const origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (listener) {
        if (!metrics.listeners.targetMap.has(this)) metrics.listeners.targetMap.set(this, new Map());
        const typeMap = metrics.listeners.targetMap.get(this);
        if (!typeMap.has(type)) typeMap.set(type, new Set());
        const set = typeMap.get(type);

        if (set.has(listener)) {
          metrics.listeners.duplicateCount.value++;
        } else {
          set.add(listener);
        }
      }
      return origAdd.call(this, type, listener, options);
    };
  }

  // ── 4. MEMORY & P95 NAVIGATION LATENCY ───────────────────────────────────
  let navStartMark = null;

  function markNavStart(route) {
    if (!isBrowserRuntime) return;
    navStartMark = { route, time: performance.now() };
  }

  function markNavEnd(route, isCached) {
    if (!navStartMark) return;
    const duration = performance.now() - navStartMark.time;
    metrics.navigationP95.latencies.push(duration);
    metrics.navigationP95.totalSamples = metrics.navigationP95.latencies.length;

    const sorted = [...metrics.navigationP95.latencies].sort((a, b) => a - b);
    const getP = (p) => Math.round(sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)] * 100) / 100;

    metrics.navigationP95.p50Ms = { value: getP(50), classification: 'Derived' };
    metrics.navigationP95.p95Ms = { value: getP(95), classification: 'Derived' };
    metrics.navigationP95.p99Ms = { value: getP(99), classification: 'Derived' };

    navStartMark = null;
  }

  if (isBrowserRuntime) {
    window.addEventListener('anhad_page_changed', (e) => markNavEnd(e.detail ? e.detail.url : window.location.href, false));
    window.addEventListener('anhad_page_restored', (e) => markNavEnd(e.detail ? e.detail.url : window.location.href, true));
    window.addEventListener('anhad_cached_return', (e) => markNavEnd(e.detail ? e.detail.url : window.location.href, true));
  }

  function updateMemory() {
    if (isBrowserRuntime && performance.memory) {
      const heapMB = Math.round((performance.memory.usedJSHeapSize / (1024 * 1024)) * 100) / 100;
      if (metrics.memoryMB.initialMB.value === 'Not Measured') {
        metrics.memoryMB.initialMB = { value: heapMB, classification: 'Directly Measured' };
      }
      metrics.memoryMB.currentMB = { value: heapMB, classification: 'Directly Measured' };

      const init = metrics.memoryMB.initialMB.value;
      if (typeof init === 'number' && init > 0) {
        metrics.memoryMB.netGrowthPercent = {
          value: Math.round(((heapMB - init) / init) * 100),
          classification: 'Derived'
        };
      }
    }
  }

  if (isBrowserRuntime) setInterval(updateMemory, 2000);

  // ── 5. PUBLIC TELEMETRY INTERFACE ─────────────────────────────────────────
  window.AnhadPerf = {
    markNavStart,
    markNavEnd,

    getReport: function() {
      updateMemory();
      return {
        context: metrics.runtimeContext,
        timestamp: new Date().toISOString(),
        metrics: {
          firstPaintMs: metrics.startupPipeline.firstPaintMs,
          firstContentfulPaintMs: metrics.startupPipeline.firstContentfulPaintMs,
          largestContentfulPaintMs: metrics.startupPipeline.largestContentfulPaintMs,
          navigationP95Ms: metrics.navigationP95.p95Ms,
          navigationP50Ms: metrics.navigationP50Ms || metrics.navigationP95.p50Ms,
          currentFps: metrics.fps.current,
          minFps: metrics.fps.min,
          frameDrops: metrics.fps.frameDrops,
          longTaskCount: metrics.mainThreadBudget.longTaskCount,
          jsHeapCurrentMB: metrics.memoryMB.currentMB,
          jsHeapGrowthPercent: metrics.memoryMB.netGrowthPercent,
          duplicateListeners: metrics.listeners.duplicateCount
        }
      };
    },

    logSummary: function() {
      const report = this.getReport();
      console.group(`📊 TELEMETRY REPORT [Context: ${report.context}]`);
      console.table(report.metrics);
      console.groupEnd();
      return report;
    }
  };

  console.log(`[AnhadPerf v3.0] ✅ Initialized in ${metrics.runtimeContext}`);
})();
