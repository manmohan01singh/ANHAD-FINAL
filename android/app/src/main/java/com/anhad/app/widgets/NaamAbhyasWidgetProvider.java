package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Naam Abhyas Home Screen Widget (Apple Fitness / Mindfulness Style)
 * Shows hourly reminder progress, streak, and next reminder
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
        int remainingHours = getSafeInt(data, "remainingHours", Math.max(0, totalHours - completedHours));
        boolean enabled = getSafeBoolean(data, "enabled", true);
        String nextReminder = getSafeString(data, "nextReminder", "");

        // Streak badge
        String streakText = streak > 0 ? "🔥 " + streak + "d Streak" : "☬ Simran";
        views.setTextViewText(R.id.naam_streak, streakText);

        // Progress stats
        int percentage = totalHours > 0 ? (completedHours * 100 / totalHours) : 0;
        views.setTextViewText(R.id.naam_progress_text, percentage + "%");
        views.setTextViewText(R.id.naam_completed, String.valueOf(completedHours));
        views.setTextViewText(R.id.naam_remaining, String.valueOf(remainingHours));

        // Next reminder
        if (enabled && !nextReminder.isEmpty()) {
            views.setTextViewText(R.id.naam_next, "🔔 Next: " + nextReminder + " • Tap to open");
        } else if (enabled) {
            views.setTextViewText(R.id.naam_next, "Hourly reminders active • Tap to open");
        } else {
            views.setTextViewText(R.id.naam_next, "Tap to start Waheguru Simran");
        }

        // Click to open Naam Abhyas
        views.setOnClickPendingIntent(R.id.naam_widget_container,
            createOpenAppIntent(context, "/naam-abhyas"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
