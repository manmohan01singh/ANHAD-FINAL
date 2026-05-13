package com.gurbaniradio.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service for smart reminders and alarms.
 * Runs at high priority to bypass Doze mode for alarm delivery.
 */
public class ReminderForegroundService extends Service {

    private static final String CHANNEL_ID = "anhad_reminder_service";
    private static final int NOTIFICATION_ID = 9002;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // BUG-10 FIX: Guard against null intent from START_STICKY OS restart
        String action = (intent != null) ? intent.getStringExtra("action") : null;

        // Must call startForeground() immediately to avoid ANR on Android 8+
        startForeground(NOTIFICATION_ID, buildNotification());

        if ("reschedule".equals(action)) {
            // Boot receiver triggered this — schedule the rescheduling flag
            rescheduleAlarmsFromPrefs();
        }

        return START_STICKY;
    }

    /**
     * Called after device reboot. Marks SharedPreferences so that when the
     * WebView next opens, the JS alarm system re-registers all notifications.
     * Direct AlarmManager scheduling from Java requires serializing the full
     * reminder model which lives in the JS localStorage — so we use the flag
     * approach: JS checks this on every cold start and re-schedules if set.
     */
    private void rescheduleAlarmsFromPrefs() {
        try {
            android.content.SharedPreferences prefs =
                getSharedPreferences("streak_saver_prefs", MODE_PRIVATE);
            prefs.edit()
                .putBoolean("needs_alarm_reschedule", true)
                .putLong("reschedule_requested_at", System.currentTimeMillis())
                .apply();
            android.util.Log.d("ReminderFGService",
                "Post-boot reschedule flag set — JS will re-register alarms on next open");
        } catch (Exception e) {
            android.util.Log.e("ReminderFGService", "rescheduleAlarmsFromPrefs failed", e);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ANHAD Reminder Service",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Ensures spiritual reminder alarms fire reliably even in Doze mode");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingOpen = PendingIntent.getActivity(this, 200, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ANHAD Reminders Active")
            .setContentText("Spiritual practice reminders are running")
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentIntent(pendingOpen)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
}
