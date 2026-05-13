package com.gurbaniradio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Streak Saver Boot Receiver
 * Schedules the 6:01 AM streak saver check notification when device boots
 */
public class StreakSaverBootReceiver extends BroadcastReceiver {
    private static final String TAG = "StreakSaverBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - rescheduling alarms via ReminderForegroundService");

            try {
                // Mark that the app needs to reschedule its alarms
                android.content.SharedPreferences prefs = context.getSharedPreferences(
                    "streak_saver_prefs", Context.MODE_PRIVATE);
                prefs.edit().putBoolean("needs_streak_saver_schedule", true).apply();

                // BUG-05 FIX: Start ReminderForegroundService with reschedule action.
                // A bare sendBroadcast() had no receiver — the JS side is not running at boot.
                Intent serviceIntent = new Intent(context, ReminderForegroundService.class);
                serviceIntent.putExtra("action", "reschedule");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }

                Log.d(TAG, "ReminderForegroundService started for post-boot alarm rescheduling");
            } catch (Exception e) {
                Log.e(TAG, "Error starting ReminderForegroundService on boot", e);
            }
        }
    }
}
