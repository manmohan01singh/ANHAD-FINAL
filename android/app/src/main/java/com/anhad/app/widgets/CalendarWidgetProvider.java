package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Gurpurab Sikh Calendar Home Screen Widget
 * Shows upcoming Gurpurab countdown, event title, and Nanakshahi date
 */
public class CalendarWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "calendar");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.calendar_widget);

        // Extract data
        String nextEventName = getSafeString(data, "nextEventName", "Parkash Sri Guru Nanak Dev Ji");
        int daysUntil = getSafeInt(data, "daysUntil", 0);
        String nanakshahiDate = getSafeString(data, "nanakshahiDate", "");
        String eventDate = getSafeString(data, "eventDate", "");

        // Header date
        if (!nanakshahiDate.isEmpty()) {
            views.setTextViewText(R.id.calendar_date, nanakshahiDate);
        } else {
            SimpleDateFormat sdf = new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault());
            views.setTextViewText(R.id.calendar_date, sdf.format(new Date()));
        }

        // Countdown display
        if (daysUntil > 0) {
            views.setTextViewText(R.id.calendar_countdown, String.valueOf(daysUntil));
            views.setTextViewText(R.id.calendar_countdown_label, daysUntil == 1 ? "DAY" : "DAYS");
            views.setTextViewText(R.id.calendar_hukamnama, "In " + daysUntil + (daysUntil == 1 ? " day" : " days") + " • Tap to open calendar");
        } else if (daysUntil == 0) {
            views.setTextViewText(R.id.calendar_countdown, "☬");
            views.setTextViewText(R.id.calendar_countdown_label, "TODAY!");
            views.setTextViewText(R.id.calendar_hukamnama, "Today's Sacred Celebration! Tap to view");
        } else {
            views.setTextViewText(R.id.calendar_countdown, "☬");
            views.setTextViewText(R.id.calendar_countdown_label, "SOON");
            views.setTextViewText(R.id.calendar_hukamnama, "Upcoming Historic Sikh Events");
        }

        // Event name & date
        views.setTextViewText(R.id.calendar_event_name, nextEventName);
        if (!eventDate.isEmpty()) {
            views.setTextViewText(R.id.calendar_event_date, eventDate);
        } else {
            views.setTextViewText(R.id.calendar_event_date, "Historic Sikh Celebration");
        }

        // Click opens Gurpurab Calendar
        views.setOnClickPendingIntent(R.id.calendar_widget_container,
            createOpenAppIntent(context, "/calendar"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
