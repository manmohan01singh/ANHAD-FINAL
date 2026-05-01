package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONObject;

/**
 * Amritvela Kirtan Home Screen Widget (24/7 Divine Kirtan)
 * Shows currently playing track with moon theme styling
 */
public class AmritvelaWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "amritvela");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.amritvela_widget);

        // Extract data with safe defaults
        String trackName = getSafeString(data, "trackName", "Amritvela Kirtan");
        String stationName = getSafeString(data, "stationName", "24/7 Divine Kirtan");
        boolean isPlaying = getSafeBoolean(data, "isPlaying", false);
        String trackCounter = getSafeString(data, "trackCounter", "Track 1 of 40");

        // Track info
        views.setTextViewText(R.id.amritvela_track, trackName);

        // Station info
        views.setTextViewText(R.id.amritvela_station, stationName);

        // Moon badge + equalizer visibility
        if (isPlaying) {
            views.setViewVisibility(R.id.amritvela_badge, 0); // Visible
            views.setViewVisibility(R.id.amritvela_equalizer, 0); // Visible
        } else {
            views.setViewVisibility(R.id.amritvela_badge, 8); // Gone
            views.setViewVisibility(R.id.amritvela_equalizer, 8); // Gone
        }

        // Play button icon
        views.setTextViewText(R.id.amritvela_play_icon, isPlaying ? "⏸" : "▶");

        // Track counter
        views.setTextViewText(R.id.amritvela_track_counter, trackCounter);

        // Click on entire widget opens the Amritvela page
        views.setOnClickPendingIntent(R.id.amritvela_widget_container,
            createOpenAppIntent(context, "/amritvela"));

        // Click on play button also opens the Amritvela page
        views.setOnClickPendingIntent(R.id.amritvela_play_button,
            createOpenAppIntent(context, "/amritvela"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
