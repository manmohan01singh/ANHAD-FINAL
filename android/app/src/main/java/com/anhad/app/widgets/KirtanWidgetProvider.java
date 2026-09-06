package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Live Kirtan Home Screen Widget (Apple Music / Spotify iOS Glassmorphism)
 * Shows currently playing track, live badge, and audio controls
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

        // Track & station text
        views.setTextViewText(R.id.kirtan_track, trackName);
        String stationText = stationName;
        if (!duration.isEmpty()) {
            stationText += " • " + duration;
        }
        views.setTextViewText(R.id.kirtan_station, stationText);

        // Live badge, equalizer, and play/pause icon
        if (isPlaying) {
            views.setViewVisibility(R.id.kirtan_live_badge, android.view.View.VISIBLE);
            views.setViewVisibility(R.id.kirtan_equalizer, android.view.View.VISIBLE);
            views.setTextViewText(R.id.kirtan_play_icon, "⏸");
            views.setTextViewText(R.id.kirtan_status, "● Playing Live");
        } else {
            views.setViewVisibility(R.id.kirtan_live_badge, android.view.View.GONE);
            views.setViewVisibility(R.id.kirtan_equalizer, android.view.View.GONE);
            views.setTextViewText(R.id.kirtan_play_icon, "▶");
            views.setTextViewText(R.id.kirtan_status, "Tap to listen live");
        }

        // Click on entire widget or play button opens Live Kirtan
        views.setOnClickPendingIntent(R.id.kirtan_widget_container,
            createOpenAppIntent(context, "/live-kirtan"));
        views.setOnClickPendingIntent(R.id.kirtan_play_button,
            createOpenAppIntent(context, "/live-kirtan"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
