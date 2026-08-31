package com.anhad.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/**
 * Production-grade Spotify-like Foreground Service for background audio playback.
 * 
 * Features:
 * - Persistent media player notification when paused (does not vanish)
 * - Auto-resume after audio interruptions (phone calls, Instagram reels) via AudioFocus
 * - Track advance (Next/Previous) actions for Amritvela / Waheguru Simran
 * - MediaSession integration for lock screen & bluetooth controls
 * - PARTIAL_WAKE_LOCK to keep playback smooth in background
 */
public class AudioForegroundService extends Service {

    private static final String TAG = "AudioForegroundService";
    private static final String CHANNEL_ID = "anhad_audio_service";
    private static final int NOTIFICATION_ID = 9001;
    
    public static final String ACTION_PLAY = "com.anhad.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.anhad.app.ACTION_PAUSE";
    public static final String ACTION_STOP = "com.anhad.app.ACTION_STOP";
    public static final String ACTION_NEXT = "com.anhad.app.ACTION_NEXT";
    public static final String ACTION_PREV = "com.anhad.app.ACTION_PREV";
    public static final String ACTION_SYNC_PLAY = "com.anhad.app.ACTION_SYNC_PLAY";
    public static final String ACTION_SYNC_PAUSE = "com.anhad.app.ACTION_SYNC_PAUSE";
    public static final String ACTION_UPDATE_META = "com.anhad.app.ACTION_UPDATE_META";
    
    private PowerManager.WakeLock wakeLock;
    private MediaSessionCompat mediaSession;
    
    private boolean isPlaying = false;
    private String currentTitle = "ANHAD Kirtan";
    private String currentArtist = "Sri Harmandir Sahib Ji";
    private String currentStream = "darbar";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
        initMediaSession();
    }

    private void broadcastCommand(String command) {
        Intent intent = new Intent("com.anhad.app.MEDIA_COMMAND");
        intent.putExtra("command", command);
        sendBroadcast(intent);
    }

    private void detachForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_DETACH);
        } else {
            stopForeground(false);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            if (currentTitle == null || currentTitle.isEmpty()) {
                currentTitle = "ANHAD Kirtan";
                currentArtist = "Sri Harmandir Sahib Ji";
                currentStream = "darbar";
            }
            if (isPlaying) {
                startForeground(NOTIFICATION_ID, buildNotification());
            } else {
                updateNotification();
            }
            return START_STICKY;
        }

        String action = intent.getAction();
        
        // 1. User clicked Stop on notification
        if (ACTION_STOP.equals(action) || "STOP".equals(action)) {
            isPlaying = false;
            updateMediaSessionState();
            broadcastCommand("STOP");
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        
        // 2. User clicked Pause on notification
        if (ACTION_PAUSE.equals(action)) {
            isPlaying = false;
            updateMediaSessionState();
            updateNotification();
            detachForeground();
            broadcastCommand("PAUSE");
            return START_STICKY;
        }
        
        // 3. User clicked Play on notification
        if (ACTION_PLAY.equals(action)) {
            isPlaying = true;
            updateMediaSessionState();
            startForeground(NOTIFICATION_ID, buildNotification());
            broadcastCommand("PLAY");
            return START_STICKY;
        }

        // 4. JS Sync: Play state updated from web layer (DO NOT ECHO BROADCAST)
        if (ACTION_SYNC_PLAY.equals(action)) {
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            String stream = intent.getStringExtra("stream");
            if (title != null) currentTitle = title;
            if (artist != null) currentArtist = artist;
            if (stream != null) currentStream = stream;

            isPlaying = true;
            updateMediaSessionMetadata();
            updateMediaSessionState();
            startForeground(NOTIFICATION_ID, buildNotification());
            return START_STICKY;
        }

        // 5. JS Sync: Pause state updated from web layer (DO NOT ECHO BROADCAST)
        if (ACTION_SYNC_PAUSE.equals(action)) {
            isPlaying = false;
            updateMediaSessionState();
            updateNotification();
            detachForeground();
            return START_STICKY;
        }

        // 6. JS Sync: Metadata update only
        if (ACTION_UPDATE_META.equals(action)) {
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            String stream = intent.getStringExtra("stream");
            if (title != null) currentTitle = title;
            if (artist != null) currentArtist = artist;
            if (stream != null) currentStream = stream;
            updateMediaSessionMetadata();
            updateNotification();
            return START_STICKY;
        }

        if (ACTION_NEXT.equals(action) || "NEXT".equals(action)) {
            broadcastCommand("NEXT");
            return START_STICKY;
        }

        if (ACTION_PREV.equals(action) || "PREV".equals(action)) {
            broadcastCommand("PREV");
            return START_STICKY;
        }

        // Default: update metadata and start playing
        String title = intent.getStringExtra("title");
        String artist = intent.getStringExtra("artist");
        String stream = intent.getStringExtra("stream");
        if (title != null) currentTitle = title;
        if (artist != null) currentArtist = artist;
        if (stream != null) currentStream = stream;
        isPlaying = true;
        
        updateMediaSessionMetadata();
        updateMediaSessionState();
        startForeground(NOTIFICATION_ID, buildNotification());
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
                startForeground(NOTIFICATION_ID, buildNotification());
                broadcastCommand("PLAY");
            }
            
            @Override
            public void onPause() {
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
                detachForeground();
                broadcastCommand("PAUSE");
            }

            @Override
            public void onSkipToNext() {
                broadcastCommand("NEXT");
            }

            @Override
            public void onSkipToPrevious() {
                broadcastCommand("PREV");
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
            int resId = R.drawable.splash;
            if ("darbar".equals(currentStream)) {
                resId = R.drawable.artwork_darbar;
            } else if ("amritvela".equals(currentStream)) {
                resId = R.drawable.artwork_amritvela;
            } else if ("simran".equals(currentStream)) {
                resId = R.drawable.artwork_simran;
            }

            Bitmap rawArt = BitmapFactory.decodeResource(getResources(), resId);
            if (rawArt != null) {
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
                PlaybackStateCompat.ACTION_PLAY_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
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

        // Previous Action
        Intent prevIntent = new Intent(this, AudioForegroundService.class);
        prevIntent.setAction(ACTION_PREV);
        PendingIntent pendingPrev = PendingIntent.getService(this, 104, prevIntent,
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

        // Next Action
        Intent nextIntent = new Intent(this, AudioForegroundService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent pendingNext = PendingIntent.getService(this, 105, nextIntent,
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
            .setDeleteIntent(pendingStop)
            .setOngoing(isPlaying)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT);

        // Add action buttons
        builder.addAction(android.R.drawable.ic_media_previous, "Previous", pendingPrev);

        if (isPlaying) {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pendingPause);
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Play", pendingPlay);
        }

        builder.addAction(android.R.drawable.ic_media_next, "Next", pendingNext);
        builder.addAction(android.R.drawable.ic_delete, "Stop", pendingStop);

        // MediaStyle for lock screen controls (show Prev, Play/Pause, Next in compact view)
        if (mediaSession != null) {
            builder.setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2));
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
        abandonAudioFocus();
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

