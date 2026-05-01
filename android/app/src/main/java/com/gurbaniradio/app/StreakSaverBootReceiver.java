package com.gurbaniradio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Streak Saver Boot Receiver
 * Schedules the 6:01 AM streak saver check notification when device boots
 */
public class StreakSaverBootReceiver extends BroadcastReceiver {
    private static final String TAG = "StreakSaverBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - scheduling streak saver notification");
            
            // Note: Since Capacitor LocalNotifications is a JS plugin,
            // we can't directly schedule from native side.
            // Instead, we'll set a flag that the JS code will check on app startup
            try {
                android.content.SharedPreferences prefs = context.getSharedPreferences(
                    "streak_saver_prefs", Context.MODE_PRIVATE);
                prefs.edit().putBoolean("needs_streak_saver_schedule", true).apply();
                Log.d(TAG, "Set flag to schedule streak saver notification on next app open");
            } catch (Exception e) {
                Log.e(TAG, "Error setting streak saver flag", e);
            }
        }
    }
}
