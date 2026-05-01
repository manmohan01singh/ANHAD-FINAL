package com.gurbaniradio.app;

import android.content.Intent;
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

    @PluginMethod
    public void start(PluginCall call) {
        String title = call.getString("title", "ANHAD Kirtan");
        String artist = call.getString("artist", "Sri Harmandir Sahib Ji");

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);

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

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }

    @PluginMethod
    public void updateState(PluginCall call) {
        String action = call.getString("action", "PLAY");
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction(action.equals("PLAY") ? AudioForegroundService.ACTION_PLAY : AudioForegroundService.ACTION_PAUSE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }
}
