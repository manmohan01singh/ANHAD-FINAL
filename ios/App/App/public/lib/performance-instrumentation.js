/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANHAD PERFORMANCE INSTRUMENTATION
 * Evidence-based performance measurement for validation audit
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const measurements = {
    navigation: [],
    initialization: [],
    network: [],
    dom: [],
    timestamps: {}
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION TIMING
  // ═══════════════════════════════════════════════════════════════════════════
  
  function measureNavigationTiming() {
    if (!window.performance || !performance.getEntriesByType) return null;
    
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length === 0) return null;
    
    const nav = navEntries[0];
    return {
      type: nav.type, // 'navigate', 'reload', 'back_forward'
      dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      tcpConnection: Math.round(nav.connectEnd - nav.connectStart),
      requestTime: Math.round(nav.responseStart - nav.requestStart),
      responseTime: Math.round(nav.responseEnd - nav.responseStart),
      domProcessing: Math.round(nav.domInteractive - nav.responseEnd),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
      loadComplete: Math.round(nav.loadEventEnd - nav.loadEventStart),
      totalTime: Math.round(nav.loadEventEnd - nav.fetchStart)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const initTracking = {
    functionsExecuted: [],
    listenersAttached: [],
    observersCreated: [],
    timersCreated: []
  };

  window.AnhadPerf = {
    
    // Track initialization function execution
    trackInit(functionName) {
      initTracking.functionsExecuted.push({
        name: functionName,
        timestamp: performance.now()
      });
    },

    // Track event listener attachment
    trackListener(element, event) {
      initTracking.listenersAttached.push({
        element: element.tagName || element,
        event: event,
        timestamp: performance.now()
      });
    },

    // Track observer creation
    trackObserver(type) {
      initTracking.observersCreated.push({
        type: type,
        timestamp: performance.now()
      });
    },

    // Track timer creation
    trackTimer(type, id) {
      initTracking.timersCreated.push({
        type: type, // 'setTimeout', 'setInterval'
        id: id,
        timestamp: performance.now()
      });
    },

    // Get initialization stats
    getInitStats() {
      return {
        functionsExecuted: initTracking.functionsExecuted.length,
        listenersAttached: initTracking.listenersAttached.length,
        observersCreated: initTracking.observersCreated.length,
        timersCreated: initTracking.timersCreated.length,
        details: initTracking
      };
    },

    // Reset tracking (for measuring return navigation)
    resetInitTracking() {
      initTracking.functionsExecuted = [];
      initTracking.listenersAttached = [];
      initTracking.observersCreated = [];
      initTracking.timersCreated = [];
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  
  function measureNetworkRequests() {
    if (!window.performance || !performance.getEntriesByType) return null;
    
    const resources = performance.getEntriesByType('resource');
    
    const categorized = {
      html: [],
      css: [],
      js: [],
      images: [],
      fonts: [],
      api: [],
      other: []
    };

    resources.forEach(resource => {
      const entry = {
        name: resource.name,
        duration: Math.round(resource.duration),
        size: resource.transferSize || 0,
        cached: resource.transferSize === 0
      };

      if (resource.name.endsWith('.html')) {
        categorized.html.push(entry);
      } else if (resource.name.endsWith('.css')) {
        categorized.css.push(entry);
      } else if (resource.name.endsWith('.js')) {
        categorized.js.push(entry);
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        categorized.images.push(entry);
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        categorized.fonts.push(entry);
      } else if (resource.name.includes('/api/')) {
        categorized.api.push(entry);
      } else {
        categorized.other.push(entry);
      }
    });

    return {
      total: resources.length,
      html: categorized.html.length,
      css: categorized.css.length,
      js: categorized.js.length,
      images: categorized.images.length,
      fonts: categorized.fonts.length,
      api: categorized.api.length,
      other: categorized.other.length,
      cached: resources.filter(r => r.transferSize === 0).length,
      details: categorized
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  
  let domMutations = 0;
  let domNodesCreated = 0;
  
  function startDOMMutationTracking() {
    if (!window.MutationObserver) return;
    
    const observer = new MutationObserver(mutations => {
      domMutations += mutations.length;
      mutations.forEach(mutation => {
        domNodesCreated += mutation.addedNodes.length;
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    return observer;
  }

  function getDOMStats() {
    return {
      totalNodes: document.getElementsByTagName('*').length,
      mutations: domMutations,
      nodesCreated: domNodesCreated
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE MARKS & MEASURES
  // ═══════════════════════════════════════════════════════════════════════════
  
  window.AnhadPerf.mark = function(name) {
    try {
      performance.mark(name);
      measurements.timestamps[name] = performance.now();
    } catch (e) {
      console.warn('[AnhadPerf] Failed to mark:', name, e);
    }
  };

  window.AnhadPerf.measure = function(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        return Math.round(measures[measures.length - 1].duration);
      }
    } catch (e) {
      console.warn('[AnhadPerf] Failed to measure:', name, e);
    }
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  
  window.AnhadPerf.getFullReport = function() {
    return {
      timestamp: new Date().toISOString(),
      navigation: measureNavigationTiming(),
      network: measureNetworkRequests(),
      dom: getDOMStats(),
      initialization: initTracking,
      customMeasures: Array.from(performance.getEntriesByType('measure')).map(m => ({
        name: m.name,
        duration: Math.round(m.duration)
      })),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  window.AnhadPerf.logReport = function() {
    const report = window.AnhadPerf.getFullReport();
    console.group('📊 ANHAD Performance Report');
    console.log('Navigation Type:', report.navigation?.type || 'unknown');
    console.log('Total Load Time:', report.navigation?.totalTime + 'ms' || 'N/A');
    console.log('Network Requests:', report.network?.total || 0);
    console.log('- Cached:', report.network?.cached || 0);
    console.log('Initialization Functions:', report.initialization.functionsExecuted.length);
    console.log('Event Listeners:', report.initialization.listenersAttached.length);
    console.log('DOM Nodes:', report.dom.totalNodes);
    console.log('DOM Mutations:', report.dom.mutations);
    console.groupEnd();
    return report;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARISON UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  window.AnhadPerf.compare = function(baseline, current) {
    if (!baseline || !current) {
      console.error('[AnhadPerf] Need two reports to compare');
      return;
    }

    console.group('📊 Performance Comparison');
    
    const compareMetric = (name, baselineVal, currentVal, unit = 'ms') => {
      if (baselineVal === null || currentVal === null) return;
      const diff = currentVal - baselineVal;
      const pct = ((diff / baselineVal) * 100).toFixed(1);
      const emoji = diff < 0 ? '✅' : diff > 0 ? '❌' : '➖';
      console.log(`${emoji} ${name}: ${baselineVal}${unit} → ${currentVal}${unit} (${pct}%)`);
    };

    compareMetric('Total Load Time', 
      baseline.navigation?.totalTime, 
      current.navigation?.totalTime);
    
    compareMetric('Init Functions', 
      baseline.initialization.functionsExecuted.length,
      current.initialization.functionsExecuted.length,
      '');
    
    compareMetric('Network Requests',
      baseline.network?.total,
      current.network?.total,
      '');
    
    compareMetric('DOM Nodes',
      baseline.dom?.totalNodes,
      current.dom?.totalNodes,
      '');

    console.groupEnd();
  };

  // Start DOM tracking on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startDOMMutationTracking();
    });
  } else {
    startDOMMutationTracking();
  }

  // Auto-log report on window load (disabled by default)
  // Uncomment to enable:
  // window.addEventListener('load', () => {
  //   setTimeout(() => window.AnhadPerf.logReport(), 1000);
  // });

  console.log('[AnhadPerf] Performance instrumentation loaded. Use AnhadPerf.logReport() to see metrics.');
})();
