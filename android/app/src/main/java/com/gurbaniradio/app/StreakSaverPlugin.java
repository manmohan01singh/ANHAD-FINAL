package com.gurbaniradio.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Streak Saver Plugin
 * Provides native access to streak saver preferences
 */
@CapacitorPlugin(name = "StreakSaverPlugin")
public class StreakSaverPlugin extends Plugin {

    @PluginMethod
    public void checkNeedsSchedule(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(
                "streak_saver_prefs", Context.MODE_PRIVATE);
            boolean needsSchedule = prefs.getBoolean("needs_streak_saver_schedule", false);
            
            JSObject result = new JSObject();
            result.put("needsSchedule", needsSchedule);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error checking streak saver schedule flag", e);
        }
    }

    @PluginMethod
    public void clearScheduleFlag(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(
                "streak_saver_prefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("needs_streak_saver_schedule", false).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Error clearing streak saver schedule flag", e);
        }
    }
}
