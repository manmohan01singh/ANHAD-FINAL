package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Nitnem Tracker Home Screen Widget
 * Shows daily progress, streak, and completed banis
 */
public class NitnemWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "nitnem");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.nitnem_widget);

        // Extract data with safe defaults
        int streak = getSafeInt(data, "streak", 0);
        int progress = getSafeInt(data, "progress", 0);
        int completedBanis = getSafeInt(data, "completedBanis", 0);
        int totalBanis = getSafeInt(data, "totalBanis", 5);
        boolean isDark = getSafeBoolean(data, "isDark", false);
        JSONArray banisList = getSafeArray(data, "completedBanisList");

        // Theme colors
        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Set streak with fire emoji
        String streakText = streak > 0 ? "🔥 " + streak : "🙏 " + streak;
        views.setTextViewText(R.id.nitnem_streak, streakText);
        views.setTextColor(R.id.nitnem_streak, textColor);

        // Set progress percentage
        views.setTextViewText(R.id.nitnem_percentage, progress + "%");
        views.setTextColor(R.id.nitnem_percentage, textColor);

        // Update progress bar
        views.setProgressBar(R.id.nitnem_progress, 100, progress, false);

        // Set status text
        String statusText = completedBanis + " of " + totalBanis + " banis";
        views.setTextViewText(R.id.nitnem_status, statusText);
        views.setTextColor(R.id.nitnem_status, secondaryTextColor);

        // Set bani icons if available
        if (banisList != null && banisList.length() > 0) {
            StringBuilder baniIndicator = new StringBuilder();
            for (int i = 0; i < banisList.length() && i < 7; i++) {
                boolean completed = banisList.optBoolean(i, false);
                baniIndicator.append(completed ? "✓ " : "○ ");
            }
            views.setTextViewText(R.id.nitnem_bani_indicators, baniIndicator.toString().trim());
            views.setTextColor(R.id.nitnem_bani_indicators, secondaryTextColor);
        } else {
            views.setTextViewText(R.id.nitnem_bani_indicators, "");
        }

        // Set click action to open Nitnem Tracker
        views.setOnClickPendingIntent(R.id.nitnem_widget_container,
            createOpenAppIntent(context, "/nitnem-tracker"));

        // Apply theme background
        views.setInt(R.id.nitnem_widget_container, "setBackgroundColor",
            getThemeBackground(isDark));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
