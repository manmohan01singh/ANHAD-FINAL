package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Smart Reminder Schedule Widget
 * Shows today's reminder timeline
 */
public class SmartReminderWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "reminders");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.smart_reminder_widget);

        // Extract data
        int totalReminders = getSafeInt(data, "totalReminders", 0);
        int completedReminders = getSafeInt(data, "completedReminders", 0);
        String nextReminderTime = getSafeString(data, "nextReminderTime", "");
        String nextReminderLabel = getSafeString(data, "nextReminderLabel", "No reminders set");
        int streak = getSafeInt(data, "streak", 0);
        boolean allDone = getSafeBoolean(data, "allDone", false);
        boolean isDark = getSafeBoolean(data, "isDark", false);

        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Header
        views.setTextViewText(R.id.reminder_title, "Smart Reminders");
        views.setTextColor(R.id.reminder_title, textColor);

        // Status
        if (allDone) {
            views.setTextViewText(R.id.reminder_status, "All done today! 🙏");
            views.setTextColor(R.id.reminder_status, 0xFF30D158); // Green
        } else if (totalReminders > 0) {
            views.setTextViewText(R.id.reminder_status, completedReminders + " of " + totalReminders + " completed");
            views.setTextColor(R.id.reminder_status, secondaryTextColor);
        } else {
            views.setTextViewText(R.id.reminder_status, "No reminders set");
            views.setTextColor(R.id.reminder_status, secondaryTextColor);
        }

        // Next reminder
        if (!nextReminderTime.isEmpty() && !allDone) {
            views.setTextViewText(R.id.reminder_next, "🔔 " + nextReminderTime + " — " + nextReminderLabel);
            views.setTextColor(R.id.reminder_next, 0xFFFF9500); // Orange highlight
        } else {
            views.setTextViewText(R.id.reminder_next, "");
        }

        // Streak
        String streakText = streak > 0 ? "🔥 " + streak + " day streak" : "";
        views.setTextViewText(R.id.reminder_streak, streakText);
        views.setTextColor(R.id.reminder_streak, secondaryTextColor);

        // Progress bar
        int progress = totalReminders > 0 ? (completedReminders * 100 / totalReminders) : 0;
        views.setProgressBar(R.id.reminder_progress, 100, progress, false);

        // Click to open Smart Reminders
        views.setOnClickPendingIntent(R.id.reminder_widget_container,
            createOpenAppIntent(context, "/reminders"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
