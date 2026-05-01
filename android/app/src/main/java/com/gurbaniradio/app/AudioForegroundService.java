package com.gurbaniradio.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/**
 * Production-grade Foreground Service for background audio playback.
 * 
 * Features (Spotify-level):
 * - Persistent notification with artwork, title, artist
 * - Play/Pause/Stop action buttons in notification
 * - MediaSession integration for lock screen controls
 * - PARTIAL_WAKE_LOCK to keep CPU alive
 * - Handles STOP, PAUSE, PLAY actions from notification
 */
public class AudioForegroundService extends Service {

    private static final String CHANNEL_ID = "anhad_audio_service";
    private static final int NOTIFICATION_ID = 9001;
    
    public static final String ACTION_PLAY = "com.gurbaniradio.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.gurbaniradio.app.ACTION_PAUSE";
    public static final String ACTION_STOP = "com.gurbaniradio.app.ACTION_STOP";
    
    private PowerManager.WakeLock wakeLock;
    private MediaSessionCompat mediaSession;
    private boolean isPlaying = true;
    private String currentTitle = "ANHAD Kirtan";
    private String currentArtist = "Sri Harmandir Sahib Ji";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
        initMediaSession();
    }

    private void broadcastCommand(String command) {
        Intent intent = new Intent("com.gurbaniradio.app.MEDIA_COMMAND");
        intent.putExtra("command", command);
        sendBroadcast(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            
            if (ACTION_STOP.equals(action) || "STOP".equals(action)) {
                isPlaying = false;
                updateMediaSessionState();
                broadcastCommand("STOP");
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }
            
            if (ACTION_PAUSE.equals(action)) {
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
                broadcastCommand("PAUSE");
                return START_STICKY;
            }
            
            if (ACTION_PLAY.equals(action)) {
                isPlaying = true;
                updateMediaSessionState();
                updateNotification();
                broadcastCommand("PLAY");
                return START_STICKY;
            }

            // Default: start with new title/artist
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            if (title != null) currentTitle = title;
            if (artist != null) currentArtist = artist;
            isPlaying = true;
            
            updateMediaSessionMetadata();
            updateMediaSessionState();
            startForeground(NOTIFICATION_ID, buildNotification());
        }
        return START_STICKY;
    }

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, "AnhadAudioSession");
        mediaSession.setActive(true);
        
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                isPlaying = true;
                updateMediaSessionState();
                updateNotification();
                broadcastCommand("PLAY");
            }
            
            @Override
            public void onPause() {
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
                broadcastCommand("PAUSE");
            }
            
            @Override
            public void onStop() {
                isPlaying = false;
                updateMediaSessionState();
                broadcastCommand("STOP");
                stopForeground(true);
                stopSelf();
            }
        });
        
        updateMediaSessionMetadata();
        updateMediaSessionState();
    }
    
    private Bitmap getAlbumArt() {
        try {
            Bitmap rawArt = BitmapFactory.decodeResource(getResources(), R.drawable.splash);
            if (rawArt != null) {
                // Scale down to 512x512 to avoid TransactionTooLargeException while keeping it crisp
                return Bitmap.createScaledBitmap(rawArt, 512, 512, true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
    }

    private void updateMediaSessionMetadata() {
        if (mediaSession == null) return;
        Bitmap albumArt = getAlbumArt();
        mediaSession.setMetadata(new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "ANHAD")
            .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, albumArt)
            .putBitmap(MediaMetadataCompat.METADATA_KEY_ART, albumArt)
            .build());
    }
    
    private void updateMediaSessionState() {
        if (mediaSession == null) return;
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        mediaSession.setPlaybackState(new PlaybackStateCompat.Builder()
            .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_STOP |
                PlaybackStateCompat.ACTION_PLAY_PAUSE
            )
            .build());
    }

    private Notification buildNotification() {
        // Intent to open the app when notification is tapped
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.putExtra("route", "/kirtan");
        openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingOpen = PendingIntent.getActivity(this, 100, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Play action
        Intent playIntent = new Intent(this, AudioForegroundService.class);
        playIntent.setAction(ACTION_PLAY);
        PendingIntent pendingPlay = PendingIntent.getService(this, 101, playIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Pause action
        Intent pauseIntent = new Intent(this, AudioForegroundService.class);
        pauseIntent.setAction(ACTION_PAUSE);
        PendingIntent pendingPause = PendingIntent.getService(this, 102, pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            
        // Stop action
        Intent stopIntent = new Intent(this, AudioForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent pendingStop = PendingIntent.getService(this, 103, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Bitmap albumArt = getAlbumArt();
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText("ANHAD")
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setLargeIcon(albumArt)
            .setContentIntent(pendingOpen)
            .setOngoing(isPlaying)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT);

        // Add Play or Pause button based on state
        if (isPlaying) {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pendingPause);
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Play", pendingPlay);
        }
        builder.addAction(android.R.drawable.ic_delete, "Stop", pendingStop);

        // MediaStyle for lock screen controls
        if (mediaSession != null) {
            builder.setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0)); // Show play/pause in compact
        }

        return builder.build();
    }

    private void updateNotification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ANHAD Kirtan Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows while kirtan is playing in background");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "anhad:audio");
            wakeLock.acquire(4 * 60 * 60 * 1000L); // 4 hours max
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
