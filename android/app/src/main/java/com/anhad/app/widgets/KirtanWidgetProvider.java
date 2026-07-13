package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Live Kirtan Home Screen Widget (Spotify-style redesign)
 * Shows currently playing track info with cover photo in horizontal layout
 */
public class KirtanWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "kirtan");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kirtan_widget);

        // Extract data with safe defaults
        String trackName = getSafeString(data, "trackName", "Darbar Sahib Live");
        String stationName = getSafeString(data, "stationName", "Sri Harmandir Sahib Ji");
        boolean isPlaying = getSafeBoolean(data, "isPlaying", false);
        String duration = getSafeString(data, "duration", "");

        // Track info
        views.setTextViewText(R.id.kirtan_track, trackName);

        // Station info
        String stationText = stationName;
        if (!duration.isEmpty()) {
            stationText += " • " + duration;
        }
        views.setTextViewText(R.id.kirtan_station, stationText);

        // Live badge + equalizer visibility
        if (isPlaying) {
            views.setViewVisibility(R.id.kirtan_live_badge, 0); // Visible
            views.setViewVisibility(R.id.kirtan_equalizer, 0); // Visible
            views.setTextViewText(R.id.kirtan_status, "● Now Playing");
        } else {
            views.setViewVisibility(R.id.kirtan_live_badge, 8); // Gone
            views.setViewVisibility(R.id.kirtan_equalizer, 8); // Gone
            views.setTextViewText(R.id.kirtan_status, "Tap to play");
        }

        // Play button icon
        views.setTextViewText(R.id.kirtan_play_icon, isPlaying ? "⏸" : "▶");

        // Click on entire widget opens the Radio page
        views.setOnClickPendingIntent(R.id.kirtan_widget_container,
            createOpenAppIntent(context, "/live-kirtan"));

        // Click on play button also opens the Radio page (native widget can't control WebView audio directly)
        views.setOnClickPendingIntent(R.id.kirtan_play_button,
            createOpenAppIntent(context, "/live-kirtan"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
