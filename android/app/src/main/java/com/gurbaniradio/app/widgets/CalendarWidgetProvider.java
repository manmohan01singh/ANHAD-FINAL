package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Calendar & Hukamnama Home Screen Widget
 * Shows next Gurpurab countdown and daily Hukamnama
 */
public class CalendarWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "calendar");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.calendar_widget);

        // Extract data
        String nextEventName = getSafeString(data, "nextEventName", "No upcoming events");
        int daysUntil = getSafeInt(data, "daysUntil", 0);
        String hukamnamaPreview = getSafeString(data, "hukamnamaPreview", "");
        String nanakshahiDate = getSafeString(data, "nanakshahiDate", "");
        boolean isDark = getSafeBoolean(data, "isDark", false);

        // Theme colors
        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Header with date
        if (!nanakshahiDate.isEmpty()) {
            views.setTextViewText(R.id.calendar_date, nanakshahiDate);
        } else {
            SimpleDateFormat sdf = new SimpleDateFormat("EEEE, MMM d", Locale.getDefault());
            views.setTextViewText(R.id.calendar_date, sdf.format(new Date()));
        }
        views.setTextColor(R.id.calendar_date, secondaryTextColor);

        // Next Gurpurab countdown
        if (daysUntil > 0) {
            views.setTextViewText(R.id.calendar_countdown, String.valueOf(daysUntil));
            views.setTextViewText(R.id.calendar_countdown_label, daysUntil == 1 ? "day" : "days");
            views.setTextViewText(R.id.calendar_event_name, "until " + nextEventName);
        } else if (daysUntil == 0) {
            views.setTextViewText(R.id.calendar_countdown, "☬");
            views.setTextViewText(R.id.calendar_countdown_label, "Today!");
            views.setTextViewText(R.id.calendar_event_name, nextEventName);
        } else {
            views.setTextViewText(R.id.calendar_countdown, "-");
            views.setTextViewText(R.id.calendar_countdown_label, "");
            views.setTextViewText(R.id.calendar_event_name, nextEventName);
        }
        views.setTextColor(R.id.calendar_countdown, 0xFFFF9500); // Orange
        views.setTextColor(R.id.calendar_countdown_label, secondaryTextColor);
        views.setTextColor(R.id.calendar_event_name, textColor);

        // Hukamnama preview
        if (!hukamnamaPreview.isEmpty()) {
            // Truncate if too long
            String preview = hukamnamaPreview.length() > 60
                ? hukamnamaPreview.substring(0, 57) + "..."
                : hukamnamaPreview;
            views.setTextViewText(R.id.calendar_hukamnama, "☬ " + preview);
            views.setTextColor(R.id.calendar_hukamnama, secondaryTextColor);
        } else {
            views.setTextViewText(R.id.calendar_hukamnama, "Tap to read today's Hukamnama");
            views.setTextColor(R.id.calendar_hukamnama, secondaryTextColor);
        }

        // Click to open Calendar
        views.setOnClickPendingIntent(R.id.calendar_widget_container,
            createOpenAppIntent(context, "/calendar"));

        // Apply theme
        views.setInt(R.id.calendar_widget_container, "setBackgroundColor",
            getThemeBackground(isDark));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
