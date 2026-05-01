package com.gurbaniradio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.gurbaniradio.app.widgets.WidgetDataBridgePlugin;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    private BroadcastReceiver mediaCommandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String command = intent.getStringExtra("command");
            if (command != null) {
                Log.d(TAG, "Received media command from service: " + command);
                String jsStr = "";
                if (command.equals("PAUSE") || command.equals("STOP")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.pause(); }";
                } else if (command.equals("PLAY")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.play(); }";
                }
                
                final String finalJs = jsStr;
                if (!finalJs.isEmpty() && getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() -> {
                        getBridge().getWebView().evaluateJavascript(finalJs, null);
                    });
                }
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataBridgePlugin.class);
        registerPlugin(AudioServicePlugin.class);
        registerPlugin(StreakSaverPlugin.class);
        registerPlugin(AlarmReliabilityPlugin.class);
        super.onCreate(savedInstanceState);

        // Register receiver for background audio controls
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaCommandReceiver, new IntentFilter("com.gurbaniradio.app.MEDIA_COMMAND"), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(mediaCommandReceiver, new IntentFilter("com.gurbaniradio.app.MEDIA_COMMAND"));
        }

        // Handle widget click routing
        handleWidgetRoute(getIntent());
        // Handle notification click routing
        handleNotificationRoute(getIntent());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(mediaCommandReceiver);
        } catch (Exception e) {
            // Ignored
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Handle widget click routing when app is already running
        handleWidgetRoute(intent);
        // Handle notification click routing
        handleNotificationRoute(intent);
    }

    /**
     * Reads the "route" extra from widget click intents
     * and navigates the WebView to the correct page.
     */
    private void handleWidgetRoute(Intent intent) {
        if (intent == null) return;
        String route = intent.getStringExtra("route");
        if (route != null && !route.isEmpty()) {
            Log.d(TAG, "Widget route: " + route);
            // Wait for bridge to be ready, then navigate
            getBridge().getWebView().postDelayed(() -> {
                String url = resolveRoute(route);
                if (url != null) {
                    Log.d(TAG, "Navigating to: " + url);
                    getBridge().getWebView().loadUrl("javascript:window.location.href='" + url + "'");
                }
                // Clear the route so it doesn't re-fire on rotation
                intent.removeExtra("route");
            }, 1500); // Wait for WebView to fully load
        }
    }

    /**
     * Maps widget route names to actual HTML file paths.
     */
    private String resolveRoute(String route) {
        switch (route) {
            case "/live-kirtan":
                return "GurbaniRadio/gurbani-radio.html";
            case "/nitnem-tracker":
                return "NitnemTracker/nitnem-tracker.html";
            case "/naam-abhyas":
                return "NaamAbhyas/naam-abhyas.html";
            case "/amritvela":
                return "GurbaniRadio/gurbani-radio.html";
            case "/calendar":
                return "Calendar/GurpurabCalendar-ios.html";
            case "/hukamnama":
                return "Hukamnama/daily-hukamnama.html";
            case "/gurbani-khoj":
                return "GurbaniKhoj/gurbani-khoj.html";
            case "/reminders":
                return "reminders/smart-reminders-v7.html";
            // Legacy routes for backward compatibility
            case "/kirtan":
                return "GurbaniRadio/gurbani-radio.html";
            case "/nitnem":
                return "NitnemTracker/nitnem-tracker.html";
            case "/naamabhyas":
                return "NaamAbhyas/naam-abhyas.html";
            default:
                return null;
        }
    }

    /**
     * ═══ PRODUCTION FIX: Handles notification click routing ═══
     * 
     * Capacitor LocalNotifications plugin handles most click routing via its
     * JavaScript listener (localNotificationActionPerformed). However, on cold
     * start (app was killed), the WebView hasn't loaded yet when the intent fires.
     * 
     * Strategy: Check if intent has a launchUrl or specific notification data.
     * If detected, inject a localStorage flag that the Naam Abhyas page will read.
     */
    private void handleNotificationRoute(Intent intent) {
        if (intent == null) return;
        
        // Check for Capacitor's notification extras
        Bundle extras = intent.getExtras();
        if (extras == null) return;
        
        // Look for any indication this is a Naam Abhyas notification
        String type = extras.getString("type", null);
        String action = extras.getString("action", null);
        String url = extras.getString("url", null);
        
        boolean isNaamNotification = "naam_abhyas".equals(type) 
            || "auto_start_naam".equals(action) 
            || "show_naam".equals(action)
            || (url != null && url.contains("NaamAbhyas"));
        
        if (!isNaamNotification) return;
        
        Log.d(TAG, "🙏 Naam Abhyas notification click detected (cold start path)");
        
        String hour = extras.getString("hour", "");
        String minute = extras.getString("minute", "");
        
        // Inject localStorage bridge via JavaScript after bridge is ready
        final String jsInject = "javascript:void(function(){" +
            "try{localStorage.setItem('anhad_pending_naam_launch',JSON.stringify({" +
            "autoStart:true,hour:'" + hour + "',minute:'" + minute + "'," +
            "timestamp:" + System.currentTimeMillis() +
            "}));console.log('[MainActivity] Injected cold-start bridge');" +
            "window.location.href='NaamAbhyas/naam-abhyas.html?autoStart=true&hour=" + hour + "&minute=" + minute + "';" +
            "}catch(e){console.error('[MainActivity] Bridge injection failed:',e);}})()";
        
        navigateWhenReady(jsInject, 0);
        
        // Clear extras to prevent re-fire
        intent.removeExtra("type");
        intent.removeExtra("action");
        intent.removeExtra("url");
        intent.removeExtra("hour");
        intent.removeExtra("minute");
    }

    /**
     * Navigate/execute JS once the Capacitor bridge and WebView are ready.
     * Retries up to 8 times with increasing delay to handle cold-start scenarios.
     */
    private void navigateWhenReady(String jsOrUrl, int retryCount) {
        final int MAX_RETRIES = 8;
        final int BASE_DELAY = 400;
        
        if (retryCount >= MAX_RETRIES) {
            Log.e(TAG, "❌ Bridge never became ready after " + MAX_RETRIES + " retries");
            return;
        }

        int delay = BASE_DELAY + (retryCount * 400); // 400, 800, 1200, 1600, 2000, 2400, 2800, 3200ms
        
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().postDelayed(() -> {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        Log.d(TAG, "✅ Executing navigation (attempt " + (retryCount + 1) + ")");
                        getBridge().getWebView().loadUrl(jsOrUrl);
                    } else {
                        Log.w(TAG, "⏳ Bridge/WebView null on execute, retrying...");
                        navigateWhenReady(jsOrUrl, retryCount + 1);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Navigation error: " + e.getMessage());
                    navigateWhenReady(jsOrUrl, retryCount + 1);
                }
            }, delay);
        } else {
            Log.w(TAG, "⏳ Bridge not ready (attempt " + (retryCount + 1) + "), retrying in " + delay + "ms");
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                navigateWhenReady(jsOrUrl, retryCount + 1);
            }, delay);
        }
    }
}
