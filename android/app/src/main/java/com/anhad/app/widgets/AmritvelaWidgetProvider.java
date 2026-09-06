package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Amritvela Kirtan Home Screen Widget (Midnight Celestial Dawn Style)
 * Shows 24/7 Amritvela Kirtan stream, crescent moon badge, and attendance streak
 */
public class AmritvelaWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "amritvela");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.amritvela_widget);

        // Extract data
        String trackName = getSafeString(data, "trackName", "Amritvela Kirtan");
        String stationName = getSafeString(data, "stationName", "24/7 Divine Kirtan");
        boolean isPlaying = getSafeBoolean(data, "isPlaying", false);
        int streak = getSafeInt(data, "streak", 0);
        String trackCounter = getSafeString(data, "trackCounter", "");

        // Track info
        views.setTextViewText(R.id.amritvela_track, trackName);
        views.setTextViewText(R.id.amritvela_station, stationName);

        // Equalizer visibility & play icon
        if (isPlaying) {
            views.setViewVisibility(R.id.amritvela_equalizer, android.view.View.VISIBLE);
            views.setTextViewText(R.id.amritvela_play_icon, "⏸");
        } else {
            views.setViewVisibility(R.id.amritvela_equalizer, android.view.View.GONE);
            views.setTextViewText(R.id.amritvela_play_icon, "▶");
        }

        // Attendance streak / track counter
        if (streak > 0) {
            views.setTextViewText(R.id.amritvela_track_counter, "🔥 " + streak + "d Amritvela Streak");
        } else if (!trackCounter.isEmpty()) {
            views.setTextViewText(R.id.amritvela_track_counter, trackCounter);
        } else {
            views.setTextViewText(R.id.amritvela_track_counter, "Amritvela 24/7 • Tap to listen");
        }

        // Click opens Amritvela audio
        views.setOnClickPendingIntent(R.id.amritvela_widget_container,
            createOpenAppIntent(context, "/amritvela"));
        views.setOnClickPendingIntent(R.id.amritvela_play_button,
            createOpenAppIntent(context, "/amritvela"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
