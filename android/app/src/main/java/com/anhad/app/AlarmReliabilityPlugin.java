package com.anhad.app;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmReliability")
public class AlarmReliabilityPlugin extends Plugin {

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("exactAlarm", canScheduleExactAlarms());
        result.put("batteryOptimized", isBatteryOptimized());
        result.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(result);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || canScheduleExactAlarms()) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("exactAlarm", true);
            call.resolve(result);
            return;
        }

        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("exactAlarm", false);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to open exact alarm settings", e);
        }
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        if (!isBatteryOptimized()) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("batteryOptimized", false);
            call.resolve(result);
            return;
        }

        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("batteryOptimized", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to open battery optimization settings", e);
        }
    }

    private boolean canScheduleExactAlarms() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    private boolean isBatteryOptimized() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return powerManager != null && !powerManager.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }

    @PluginMethod
    public void scheduleFullScreenAlarm(PluginCall call) {
        if (!canScheduleExactAlarms()) {
            // CRITICAL FIX: Auto-redirect to settings instead of silently rejecting
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getActivity().startActivity(intent);
                }
                call.resolve(new JSObject().put("openedSettings", true).put("exactAlarm", false));
            } catch (Exception e) {
                call.reject("Exact alarms permission not granted");
            }
            return;
        }

        try {
            int id = call.getInt("id", 0);
            long timestamp = call.getLong("timestamp", 0L);
            String title = call.getString("title", "Alarm");
            String message = call.getString("message", "");
            String hour = call.getString("hour", "");
            String minute = call.getString("minute", "");

            if (timestamp <= System.currentTimeMillis()) {
                call.reject("Timestamp is in the past");
                return;
            }

            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            intent.putExtra("id", id);
            intent.putExtra("title", title);
            intent.putExtra("message", message);
            intent.putExtra("hour", hour);
            intent.putExtra("minute", minute);

            int flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= android.app.PendingIntent.FLAG_IMMUTABLE;
            }

            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                    getContext(),
                    id,
                    intent,
                    flags
            );

            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
                        timestamp,
                        pendingIntent // Used to show icon in status bar, can just reuse
                );
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                call.reject("AlarmManager is null");
            }
        } catch (Exception e) {
            call.reject("Failed to schedule full screen alarm", e);
        }
    }
}
