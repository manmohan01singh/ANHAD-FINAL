package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONObject;

/**
 * Naam Abhyas Home Screen Widget
 * Shows hourly reminder progress with circular progress indicator
 */
public class NaamAbhyasWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "naamabhyas");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.naam_abhyas_widget);

        // Extract data
        int streak = getSafeInt(data, "streak", 0);
        int completedHours = getSafeInt(data, "completedHours", 0);
        int totalHours = getSafeInt(data, "totalHours", 17);
        int remainingHours = getSafeInt(data, "remainingHours", totalHours - completedHours);
        boolean enabled = getSafeBoolean(data, "enabled", false);
        boolean isDark = getSafeBoolean(data, "isDark", false);
        String nextReminder = getSafeString(data, "nextReminder", "");

        // Theme colors
        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Streak display
        String streakText = streak > 0 ? "🔥 " + streak + " day streak" : "🙏 Start today";
        views.setTextViewText(R.id.naam_streak, streakText);
        views.setTextColor(R.id.naam_streak, textColor);

        if (enabled) {
            // Progress stats
            views.setTextViewText(R.id.naam_completed, String.valueOf(completedHours));
            views.setTextViewText(R.id.naam_remaining, String.valueOf(remainingHours));
            views.setTextColor(R.id.naam_completed, 0xFF30D158); // Green
            views.setTextColor(R.id.naam_remaining, 0xFFFF9500); // Orange

            // Progress text
            int percentage = totalHours > 0 ? (completedHours * 100 / totalHours) : 0;
            views.setTextViewText(R.id.naam_progress_text, percentage + "%");
            views.setTextColor(R.id.naam_progress_text, textColor);

            // Next reminder
            if (!nextReminder.isEmpty()) {
                views.setTextViewText(R.id.naam_next, "Next: " + nextReminder);
                views.setTextColor(R.id.naam_next, secondaryTextColor);
            } else {
                views.setTextViewText(R.id.naam_next, "Hourly reminders active");
            }
        } else {
            // Widget not enabled state
            views.setTextViewText(R.id.naam_completed, "-");
            views.setTextViewText(R.id.naam_remaining, "-");
            views.setTextViewText(R.id.naam_progress_text, "OFF");
            views.setTextViewText(R.id.naam_next, "Tap to enable reminders");
            views.setTextColor(R.id.naam_next, 0xFFFF3B30); // Red
        }

        // Click to open Naam Abhyas
        views.setOnClickPendingIntent(R.id.naam_widget_container,
            createOpenAppIntent(context, "/naam-abhyas"));

        // Apply theme
        views.setInt(R.id.naam_widget_container, "setBackgroundColor",
            getThemeBackground(isDark));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
