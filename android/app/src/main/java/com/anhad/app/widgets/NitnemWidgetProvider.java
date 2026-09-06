package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Nitnem Tracker Home Screen Widget
 * Shows daily progress, Amritvela streak, completed banis, and pending banis
 */
public class NitnemWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "nitnem");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.nitnem_widget);

        // Extract data with safe defaults
        int amritvelaStreak = getSafeInt(data, "amritvelaStreak", getSafeInt(data, "streak", 0));
        int streak = getSafeInt(data, "streak", 0);
        int displayStreak = amritvelaStreak > 0 ? amritvelaStreak : streak;
        int progress = getSafeInt(data, "progress", 0);
        int completedBanis = getSafeInt(data, "completedBanis", 0);
        int totalBanis = getSafeInt(data, "totalBanis", 5);
        String pendingBanis = getSafeString(data, "pendingBanis", "");
        boolean allDone = getSafeBoolean(data, "allDone", completedBanis >= totalBanis && totalBanis > 0);
        JSONArray banisList = getSafeArray(data, "completedBanisList");

        // 1. Streak with Amritvela badge
        String streakText = displayStreak > 0 ? "🔥 " + displayStreak + "d Streak" : "☬ Start Today";
        views.setTextViewText(R.id.nitnem_streak, streakText);

        // 2. Status & percentage
        String statusText;
        if (allDone) {
            statusText = "All " + totalBanis + " Banis Done! 🙏";
        } else {
            statusText = completedBanis + " of " + totalBanis + " Banis Done";
        }
        views.setTextViewText(R.id.nitnem_status, statusText);
        views.setTextViewText(R.id.nitnem_percentage, progress + "%");

        // 3. Progress bar
        views.setProgressBar(R.id.nitnem_progress, 100, Math.min(100, progress), false);

        // 4. Pending Banis display
        if (allDone) {
            views.setTextViewText(R.id.nitnem_pending_label, "✓ Status:");
            views.setTextViewText(R.id.nitnem_pending_banis, "All Nitnem Banis Completed! 🙏✨");
        } else if (!pendingBanis.isEmpty()) {
            views.setTextViewText(R.id.nitnem_pending_label, "⏳ Pending Banis:");
            views.setTextViewText(R.id.nitnem_pending_banis, pendingBanis);
        } else {
            views.setTextViewText(R.id.nitnem_pending_label, "⏳ Daily Nitnem:");
            views.setTextViewText(R.id.nitnem_pending_banis, "Tap to continue reading");
        }

        // 5. Bani dot indicators
        if (banisList != null && banisList.length() > 0) {
            StringBuilder indicator = new StringBuilder();
            for (int i = 0; i < banisList.length() && i < 10; i++) {
                boolean completed = banisList.optBoolean(i, false);
                indicator.append(completed ? "✓ " : "○ ");
            }
            views.setTextViewText(R.id.nitnem_bani_indicators, indicator.toString().trim());
        } else {
            StringBuilder indicator = new StringBuilder();
            for (int i = 0; i < totalBanis && i < 10; i++) {
                indicator.append(i < completedBanis ? "✓ " : "○ ");
            }
            views.setTextViewText(R.id.nitnem_bani_indicators, indicator.toString().trim());
        }

        // 6. Click action opens Nitnem Tracker
        views.setOnClickPendingIntent(R.id.nitnem_widget_container,
            createOpenAppIntent(context, "/nitnem-tracker"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
