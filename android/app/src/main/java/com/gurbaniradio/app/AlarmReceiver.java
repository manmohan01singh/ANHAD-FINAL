package com.gurbaniradio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    private static final String CHANNEL_ID = "anhad_full_screen_alarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "⏰ Alarm Received in Native Receiver!");

        // Acquire a brief wake lock to ensure the device doesn't sleep before Activity starts
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        try {
            wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "AnhadApp:AlarmWakeLock"
            );
            wakeLock.acquire(5000); // Hold for 5 seconds max

        String title = intent.getStringExtra("title");
        String message = intent.getStringExtra("message");
        String hour = intent.getStringExtra("hour");
        String minute = intent.getStringExtra("minute");

        Intent activityIntent = new Intent(context, FullScreenAlarmActivity.class);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        activityIntent.putExtra("title", title != null ? title : "Naam Abhyas");
        activityIntent.putExtra("message", message != null ? message : "Time to remember Vaheguru");
        activityIntent.putExtra("hour", hour);
        activityIntent.putExtra("minute", minute);

        int requestCode = intent.getIntExtra("id", (int) (System.currentTimeMillis() & 0xfffffff));
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent fullScreenIntent = PendingIntent.getActivity(context, requestCode, activityIntent, flags);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "ANHAD Full Screen Alarms",
                    // FIX: IMPORTANCE_MAX required for full-screen intents on Android 8+
                    // IMPORTANCE_HIGH is insufficient — system may suppress the full-screen activity
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Full screen reminders for Naam Abhyas and smart alarms");
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            // FIX: Enable vibration and bypass DND for alarm-level importance
            channel.enableVibration(true);
            channel.setBypassDnd(true);
            // FIX: Only create channel if it doesn't already exist
            if (notificationManager.getNotificationChannel(CHANNEL_ID) == null) {
                notificationManager.createNotificationChannel(channel);
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(title != null ? title : "Naam Abhyas")
                .setContentText(message != null ? message : "Time to remember Vaheguru")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setOngoing(false)
                .setContentIntent(fullScreenIntent)
                .setFullScreenIntent(fullScreenIntent, true);

        if (notificationManager != null) {
            notificationManager.notify(requestCode, builder.build());
        }

        try {
            context.startActivity(activityIntent);
        } catch (Exception e) {
            Log.w(TAG, "Activity launch deferred to full-screen notification", e);
        }
        } finally {
            // FIX: Always release WakeLock — even if an exception is thrown above
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }
}
