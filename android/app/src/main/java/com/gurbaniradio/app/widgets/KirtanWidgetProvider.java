package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONObject;

/**
 * Live Kirtan Home Screen Widget
 * Shows currently playing track info
 */
public class KirtanWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "kirtan");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kirtan_widget);

        // Extract data
        String trackName = getSafeString(data, "trackName", "Not Playing");
        String stationName = getSafeString(data, "stationName", "Select Station");
        boolean isPlaying = getSafeBoolean(data, "isPlaying", false);
        String duration = getSafeString(data, "duration", "");
        boolean isDark = getSafeBoolean(data, "isDark", false);

        // Theme colors
        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Track info
        views.setTextViewText(R.id.kirtan_track, trackName);
        views.setTextColor(R.id.kirtan_track, textColor);

        // Station info
        String stationText = stationName;
        if (!duration.isEmpty()) {
            stationText += " • " + duration;
        }
        views.setTextViewText(R.id.kirtan_station, stationText);
        views.setTextColor(R.id.kirtan_station, secondaryTextColor);

        // Playing indicator
        if (isPlaying) {
            views.setTextViewText(R.id.kirtan_status, "▶ Playing");
            views.setTextColor(R.id.kirtan_status, 0xFF30D158); // Green
        } else {
            views.setTextViewText(R.id.kirtan_status, "⏸ Paused");
            views.setTextColor(R.id.kirtan_status, 0xFFFF9500); // Orange
        }

        // Click to open Radio
        views.setOnClickPendingIntent(R.id.kirtan_widget_container,
            createOpenAppIntent(context, "/live-kirtan"));

        // Apply theme
        views.setInt(R.id.kirtan_widget_container, "setBackgroundColor",
            getThemeBackground(isDark));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
