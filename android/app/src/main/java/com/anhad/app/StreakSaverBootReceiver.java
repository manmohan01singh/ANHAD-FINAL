package com.anhad.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Streak Saver Boot Receiver
 * Schedules the 6:01 AM streak saver check notification when device boots,
 * and marks that the JS-side alarm system should re-register its reminders.
 *
 * ANDROID 15 FIX: this used to hand off to ReminderForegroundService for the
 * second SharedPreferences write below — real Android 15 device testing
 * (Pixel_7_API35 AVD) showed that was never viable: ForegroundServiceStart
 * NotAllowedException fires for a BOOT_COMPLETED-triggered start regardless
 * of foregroundServiceType (both dataSync and shortService were tried and
 * both rejected — this appears to be a BOOT_COMPLETED-specific restriction,
 * not a per-type one). The service's only job was two synchronous
 * SharedPreferences.apply() calls — the same kind of write this receiver
 * already does directly two lines above — so there was never a real need
 * for a foreground service here; onReceive()'s own execution window is
 * plenty for a synchronous local write, with no Doze/network/FGS
 * involvement at all.
 */
public class StreakSaverBootReceiver extends BroadcastReceiver {
    private static final String TAG = "StreakSaverBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - rescheduling alarms directly");

            try {
                // Mark that the app needs to reschedule its alarms
                android.content.SharedPreferences prefs = context.getSharedPreferences(
                    "streak_saver_prefs", Context.MODE_PRIVATE);
                prefs.edit().putBoolean("needs_streak_saver_schedule", true).apply();

                // Marks SharedPreferences so that when the WebView next opens, the JS
                // alarm system re-registers all notifications. Direct AlarmManager
                // scheduling from Java requires serializing the full reminder model
                // which lives in JS localStorage — so we use the flag approach: JS
                // checks this on every cold start and re-schedules if set.
                android.content.SharedPreferences capacitorPrefs = context.getSharedPreferences(
                    "CapacitorStorage", Context.MODE_PRIVATE);
                capacitorPrefs.edit()
                        .putString("needs_alarm_reschedule", "true")
                        .putLong("reschedule_requested_at", System.currentTimeMillis())
                        .apply();

                Log.d(TAG, "Post-boot reschedule flags set — JS will re-register alarms on next open");
            } catch (Exception e) {
                Log.e(TAG, "Error setting post-boot reschedule flags", e);
            }
        }
    }
}
