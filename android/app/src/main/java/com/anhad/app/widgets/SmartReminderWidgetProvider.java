package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Sangat Notifications & Friend Requests Home Screen Widget
 * Shows pending friend requests, companion Amritvela attendance alerts, and Sangat activity
 */
public class SmartReminderWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "reminders");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.smart_reminder_widget);

        // Extract data
        int pendingRequests = getSafeInt(data, "pendingRequests", 0);
        int unreadNotifs = getSafeInt(data, "unreadNotifs", 0);
        String latestAlert = getSafeString(data, "latestAlert", "");
        String statusText = getSafeString(data, "statusText", "");
        int streak = getSafeInt(data, "streak", 0);

        // Header Badge
        if (pendingRequests > 0) {
            views.setTextViewText(R.id.reminder_streak, "👥 " + pendingRequests + " Requests");
        } else if (unreadNotifs > 0) {
            views.setTextViewText(R.id.reminder_streak, "🔔 " + unreadNotifs + " New");
        } else if (streak > 0) {
            views.setTextViewText(R.id.reminder_streak, "🔥 " + streak + "d Streak");
        } else {
            views.setTextViewText(R.id.reminder_streak, "Sangat Active");
        }

        // Title & status
        if (pendingRequests > 0) {
            views.setTextViewText(R.id.reminder_title, pendingRequests + " Friend Request" + (pendingRequests > 1 ? "s" : "") + " Pending");
            views.setTextViewText(R.id.reminder_status, latestAlert.isEmpty() ? "Sangat members want to connect with you" : latestAlert);
            views.setTextViewText(R.id.reminder_next, "Tap to review and accept requests");
        } else if (!latestAlert.isEmpty()) {
            views.setTextViewText(R.id.reminder_title, "Sangat Companion Alert");
            views.setTextViewText(R.id.reminder_status, latestAlert);
            views.setTextViewText(R.id.reminder_next, "Tap to open Sangat notifications");
        } else {
            views.setTextViewText(R.id.reminder_title, "Sangat Network Connected");
            views.setTextViewText(R.id.reminder_status, statusText.isEmpty() ? "All caught up with Sangat activity 🙏" : statusText);
            views.setTextViewText(R.id.reminder_next, "Tap to find friends & companion Sangat");
        }

        // Click opens Sangat / Friends / Notifications
        views.setOnClickPendingIntent(R.id.reminder_widget_container,
            createOpenAppIntent(context, "/notifications"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
