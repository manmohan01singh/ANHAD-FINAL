package com.gurbaniradio.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

public class FullScreenAlarmActivity extends AppCompatActivity {
    private static final String TAG = "FullScreenAlarmActivity";
    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Essential flags to wake up screen and show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_full_screen_alarm);

        // Acquire WakeLock
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "AnhadApp:AlarmActivityWakeLock");
            wakeLock.acquire(10 * 60 * 1000L /*10 minutes*/);
        }

        // Extract intent data
        Intent intent = getIntent();
        String titleText = intent.getStringExtra("title");
        String messageText = intent.getStringExtra("message");
        final String hour = intent.getStringExtra("hour");
        final String minute = intent.getStringExtra("minute");

        TextView title = findViewById(R.id.alarmTitle);
        TextView message = findViewById(R.id.alarmMessage);
        Button dismissBtn = findViewById(R.id.btnDismiss);
        Button startBtn = findViewById(R.id.btnStart);

        if (titleText != null) title.setText(titleText);
        if (messageText != null) message.setText(messageText);

        // Play alarm sound (assuming a default sound is in res/raw/naam_alarm.mp3, or we can use default ringtone)
        playAlarmSound();

        dismissBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                stopAlarmAndFinish();
            }
        });

        startBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Open MainActivity and pass routing info
                Intent launchIntent = new Intent(FullScreenAlarmActivity.this, MainActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                
                // We use standard capacitor notification extras style to be caught by MainActivity
                launchIntent.putExtra("type", "naam_abhyas");
                launchIntent.putExtra("action", "auto_start_naam");
                launchIntent.putExtra("hour", hour != null ? hour : "");
                launchIntent.putExtra("minute", minute != null ? minute : "");
                
                startActivity(launchIntent);
                stopAlarmAndFinish();
            }
        });
    }

    private void playAlarmSound() {
        try {
            Uri defaultRingtoneUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, defaultRingtoneUri);
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm sound", e);
        }
    }

    private void stopAlarmAndFinish() {
        releaseResources();
        finish();
    }

    /** Releases MediaPlayer and WakeLock without calling finish() */
    private void releaseResources() {
        if (mediaPlayer != null) {
            try {
                // FIX: isPlaying() throws IllegalStateException if called after release()
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (IllegalStateException ignored) {}
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // FIX: Only release resources here, do NOT call finish() again
        // (finish() is already called by stopAlarmAndFinish or the system)
        releaseResources();
    }
}
