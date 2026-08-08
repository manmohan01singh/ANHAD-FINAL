package com.anhad.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.anhad.app.widgets.WidgetDataBridgePlugin;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.material.snackbar.Snackbar;
import android.view.View;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final int UPDATE_REQUEST_CODE = 500;
    
    // In-App Update Manager
    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateUpdatedListener;

    private BroadcastReceiver mediaCommandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String command = intent.getStringExtra("command");
            if (command != null) {
                Log.d(TAG, "Received media command from service: " + command);
                String jsStr = "";
                if (command.equals("PAUSE")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.pauseFromNative(); }";
                } else if (command.equals("STOP")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.stopFromNative(); }";
                } else if (command.equals("PLAY") || command.equals("RECONNECT")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.resumeFromNative(); }";
                } else if (command.equals("NEXT")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.playNextTrack(true); }";
                } else if (command.equals("PREV")) {
                    jsStr = "if(window.AnhadAudio) { window.AnhadAudio.playNextTrack(false); }";
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

        // ═══════════════════════════════════════════════════════════════════
        // IN-APP UPDATE: Check for updates on app launch
        // ═══════════════════════════════════════════════════════════════════
        initializeInAppUpdates();

        // ═══════════════════════════════════════════════════════════════════
        // IMMERSIVE FULLSCREEN: Hide status bar completely when app opens
        // ═══════════════════════════════════════════════════════════════════
        if (getWindow() != null) {
            getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                if (getWindow().getInsetsController() != null) {
                    getWindow().getInsetsController().hide(android.view.WindowInsets.Type.statusBars());
                    getWindow().getInsetsController().setSystemBarsBehavior(
                        android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    );
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // NUCLEAR: Force-configure WebView for reliable audio streaming
        // Without these, <audio> elements silently refuse to play cross-origin media.
        // ═══════════════════════════════════════════════════════════════════
        android.webkit.WebView webView = getBridge().getWebView();
        if (webView != null) {
            android.webkit.WebSettings settings = webView.getSettings();

            // CRITICAL: Allow autoplay without user gesture — without this,
            // audio.play() silently fails unless triggered by a direct tap handler.
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Allow mixed content (HTTPS page loading HTTP audio streams)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // Enable media-related web features
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setDatabaseEnabled(true);

            // Allow cross-origin resource sharing for media elements
            settings.setAllowUniversalAccessFromFileURLs(true);
            settings.setAllowFileAccessFromFileURLs(true);

            Log.d(TAG, "✅ WebView configured for audio streaming: " +
                "gesture=" + settings.getMediaPlaybackRequiresUserGesture() +
                ", mixedContent=ALWAYS_ALLOW");
        }

        // Register receiver for background audio controls
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaCommandReceiver, new IntentFilter("com.anhad.app.MEDIA_COMMAND"), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(mediaCommandReceiver, new IntentFilter("com.anhad.app.MEDIA_COMMAND"));
        }

        // Handle widget click routing
        handleWidgetRoute(getIntent());
        // Handle notification click routing
        handleNotificationRoute(getIntent());
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
    /**
     * Helper to retrieve a string extra from standard root keys or nested inside Capacitor objects.
     */
    private String getNestedStringExtra(Bundle extras, String key) {
        if (extras == null) return null;
        if (extras.containsKey(key)) {
            Object val = extras.get(key);
            return val != null ? val.toString() : null;
        }
        
        // Check for Capacitor's nested "notification" JSON string
        if (extras.containsKey("notification")) {
            try {
                String notifJson = extras.getString("notification");
                if (notifJson != null) {
                    org.json.JSONObject obj = new org.json.JSONObject(notifJson);
                    if (obj.has("extra")) {
                        org.json.JSONObject extraObj = obj.getJSONObject("extra");
                        if (extraObj.has(key)) {
                            return extraObj.getString(key);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        
        // Check for Capacitor's nested "localNotification" bundle
        if (extras.containsKey("localNotification")) {
            Bundle nested = extras.getBundle("localNotification");
            if (nested != null && nested.containsKey("extra")) {
                Bundle extraBundle = nested.getBundle("extra");
                if (extraBundle != null && extraBundle.containsKey(key)) {
                    Object val = extraBundle.get(key);
                    return val != null ? val.toString() : null;
                }
            }
        }
        
        return null;
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
        
        Bundle extras = intent.getExtras();
        if (extras == null) return;
        
        String type = getNestedStringExtra(extras, "type");
        String action = getNestedStringExtra(extras, "action");
        String url = getNestedStringExtra(extras, "url");
        
        boolean isNaamNotification = "naam_abhyas".equals(type) 
            || "auto_start_naam".equals(action) 
            || "show_naam".equals(action)
            || (url != null && url.contains("NaamAbhyas"));
        
        if (!isNaamNotification) return;
        
        Log.d(TAG, "🙏 Naam Abhyas notification click detected (routing path)");
        
        String hour = getNestedStringExtra(extras, "hour");
        String minute = getNestedStringExtra(extras, "minute");
        if (hour == null) hour = "";
        if (minute == null) minute = "";
        
        // Inject localStorage bridge or dispatch custom event if already on page to prevent reloading/flicker
        final String jsInject = "javascript:void(function(){" +
            "try{" +
            "  var nh='" + hour + "'; var nm='" + minute + "';" +
            "  var isNaamPage = window.location.pathname.toLowerCase().includes('naamabhyas');" +
            "  if (isNaamPage) {" +
            "    console.log('[MainActivity] Already on Naam page, dispatching click event');" +
            "    window.dispatchEvent(new CustomEvent('naamAbhyasNotificationClick', {" +
            "      detail: { autoStart: true, hour: nh, minute: nm }" +
            "    }));" +
            "  } else {" +
            "    console.log('[MainActivity] Navigating to Naam page');" +
            "    localStorage.setItem('anhad_pending_naam_launch', JSON.stringify({" +
            "      autoStart: true, hour: nh, minute: nm, timestamp: Date.now()" +
            "    }));" +
            "    window.location.href = 'NaamAbhyas/naam-abhyas.html?autoStart=true&hour=' + nh + '&minute=' + nm;" +
            "  }" +
            "}catch(e){console.error('[MainActivity] Bridge injection failed:',e);}})()";
        
        navigateWhenReady(jsInject, 0);
        
        // Clear extras to prevent re-fire
        intent.removeExtra("type");
        intent.removeExtra("action");
        intent.removeExtra("url");
        intent.removeExtra("hour");
        intent.removeExtra("minute");
        if (extras.containsKey("notification")) {
            intent.removeExtra("notification");
        }
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

    // ═══════════════════════════════════════════════════════════════════
    // IN-APP UPDATE IMPLEMENTATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Initialize In-App Updates system.
     * Checks for available updates and prompts user.
     */
    private void initializeInAppUpdates() {
        appUpdateManager = AppUpdateManagerFactory.create(this);
        
        // Listen for flexible update download status
        installStateUpdatedListener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                popupSnackbarForCompleteUpdate();
            }
        };
        
        // Register listener
        appUpdateManager.registerListener(installStateUpdatedListener);
        
        // Check for updates
        checkForAppUpdate();
    }

    /**
     * Check if an update is available on Google Play.
     */
    private void checkForAppUpdate() {
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                // Check priority from Play Console
                int priority = appUpdateInfo.updatePriority();
                
                // If priority >= 4, force immediate update (for critical fixes)
                // Otherwise, use flexible update
                if (priority >= 4 && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                    startImmediateUpdate(appUpdateInfo);
                } else if (appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                    startFlexibleUpdate(appUpdateInfo);
                }
            } else if (appUpdateInfo.installStatus() == InstallStatus.DOWNLOADED) {
                popupSnackbarForCompleteUpdate();
            }
        }).addOnFailureListener(e -> {
            Log.e(TAG, "Update check failed: " + e.getMessage());
        });
    }

    /**
     * Start FLEXIBLE update (user can continue using app while downloading).
     */
    private void startFlexibleUpdate(AppUpdateInfo appUpdateInfo) {
        try {
            appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                AppUpdateType.FLEXIBLE,
                this,
                UPDATE_REQUEST_CODE
            );
            Log.d(TAG, "✅ Flexible update started");
        } catch (Exception e) {
            Log.e(TAG, "Flexible update failed: " + e.getMessage());
        }
    }

    /**
     * Start IMMEDIATE update (user must update before continuing).
     * Use for critical bug fixes.
     */
    private void startImmediateUpdate(AppUpdateInfo appUpdateInfo) {
        try {
            appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                AppUpdateType.IMMEDIATE,
                this,
                UPDATE_REQUEST_CODE
            );
            Log.d(TAG, "✅ Immediate update started");
        } catch (Exception e) {
            Log.e(TAG, "Immediate update failed: " + e.getMessage());
        }
    }

    /**
     * Show snackbar notification when flexible update is downloaded.
     */
    private void popupSnackbarForCompleteUpdate() {
        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            Snackbar snackbar = Snackbar.make(
                rootView,
                "🪯 New version of ANHAD downloaded!",
                Snackbar.LENGTH_INDEFINITE
            );
            snackbar.setAction("RESTART", view -> {
                appUpdateManager.completeUpdate();
            });
            snackbar.setActionTextColor(getResources().getColor(android.R.color.holo_orange_light));
            snackbar.show();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        
        // Check for stalled in-progress updates
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                // If an immediate update was stalled, resume it
                try {
                    appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        AppUpdateType.IMMEDIATE,
                        this,
                        UPDATE_REQUEST_CODE
                    );
                } catch (Exception e) {
                    Log.e(TAG, "Resume update failed: " + e.getMessage());
                }
            } else if (appUpdateInfo.installStatus() == InstallStatus.DOWNLOADED) {
                popupSnackbarForCompleteUpdate();
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == UPDATE_REQUEST_CODE) {
            if (resultCode != RESULT_OK) {
                Log.d(TAG, "Update flow failed! Result code: " + resultCode);
                // User cancelled or update failed - you can retry or log
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(mediaCommandReceiver);
        } catch (Exception e) {
            // Ignored
        }
        
        // Unregister update listener
        if (appUpdateManager != null && installStateUpdatedListener != null) {
            appUpdateManager.unregisterListener(installStateUpdatedListener);
        }
    }
}
