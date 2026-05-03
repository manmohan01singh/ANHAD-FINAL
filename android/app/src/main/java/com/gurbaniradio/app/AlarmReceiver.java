package com.gurbaniradio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "⏰ Alarm Received in Native Receiver!");

        // Acquire a brief wake lock to ensure the device doesn't sleep before Activity starts
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "AnhadApp:AlarmWakeLock"
        );
        wakeLock.acquire(3000); // Hold for 3 seconds max

        String title = intent.getStringExtra("title");
        String message = intent.getStringExtra("message");
        String hour = intent.getStringExtra("hour");
        String minute = intent.getStringExtra("minute");

        // Launch the Full-Screen Activity
        Intent activityIntent = new Intent(context, FullScreenAlarmActivity.class);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        activityIntent.putExtra("title", title != null ? title : "Naam Abhyas");
        activityIntent.putExtra("message", message != null ? message : "Time to remember Vaheguru");
        activityIntent.putExtra("hour", hour);
        activityIntent.putExtra("minute", minute);

        context.startActivity(activityIntent);
    }
}
