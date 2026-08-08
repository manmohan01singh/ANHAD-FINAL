package com.anhad.app;

import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor Plugin to control the AudioForegroundService from JS.
 * Start when kirtan begins playing, stop when it stops.
 */
@CapacitorPlugin(name = "AudioService")
public class AudioServicePlugin extends Plugin {
    private BroadcastReceiver mediaCommandReceiver;

    @Override
    public void load() {
        mediaCommandReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String command = intent.getStringExtra("command");
                if (command == null) return;
                JSObject data = new JSObject();
                data.put("command", command);
                notifyListeners("mediaCommand", data);
            }
        };

        IntentFilter filter = new IntentFilter("com.anhad.app.MEDIA_COMMAND");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(mediaCommandReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(mediaCommandReceiver, filter);
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        String title = call.getString("title", "ANHAD Kirtan");
        String artist = call.getString("artist", "Sri Harmandir Sahib Ji");
        String stream = call.getString("stream", "darbar");

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("stream", stream);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("STOP");
        getContext().startService(intent);

        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    @PluginMethod
    public void updateNotification(PluginCall call) {
        String title = call.getString("title", "ANHAD Kirtan");
        String artist = call.getString("artist", "");
        String stream = call.getString("stream", "darbar");

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("stream", stream);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }

    private long lastPlayTime = 0;
    private static final long PLAY_DEBOUNCE_MS = 2000;

    @PluginMethod
    public void updateState(PluginCall call) {
        String action = call.getString("action", "PLAY");
        long now = System.currentTimeMillis();

        // Debounce rapid PLAY commands to prevent 1.5s reset loop
        if ("PLAY".equals(action) && (now - lastPlayTime < PLAY_DEBOUNCE_MS)) {
            System.out.println("[AudioService] Debouncing PLAY command, last=" + (now - lastPlayTime) + "ms ago");
            call.resolve();
            return;
        }

        if ("PLAY".equals(action)) {
            lastPlayTime = now;
        }

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        if ("NEXT".equals(action)) {
            intent.setAction(AudioForegroundService.ACTION_NEXT);
        } else if ("PREV".equals(action)) {
            intent.setAction(AudioForegroundService.ACTION_PREV);
        } else if ("PAUSE".equals(action)) {
            intent.setAction(AudioForegroundService.ACTION_PAUSE);
        } else {
            intent.setAction(AudioForegroundService.ACTION_PLAY);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && "PLAY".equals(action)) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (mediaCommandReceiver != null) {
            try {
                getContext().unregisterReceiver(mediaCommandReceiver);
            } catch (Exception ignored) {
            }
            mediaCommandReceiver = null;
        }
        super.handleOnDestroy();
    }
}
