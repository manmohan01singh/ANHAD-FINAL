package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Saadh Sangat Live Home Screen Widget
 * Shows live broadcast status, listener count, and one-tap listen
 */
public class SaadhSangatWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "sadhsangat");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.saadh_sangat_widget);

        // Extract data
        String title = getSafeString(data, "title", "Saadh Sangat Live Broadcast");
        String subtitle = getSafeString(data, "subtitle", "Live Gurbani Kirtan Samagam");
        int listeners = getSafeInt(data, "listeners", 1240);
        boolean isPlaying = getSafeBoolean(data, "isPlaying", false);
        boolean isLive = getSafeBoolean(data, "isLive", true);

        views.setTextViewText(R.id.sadhsangat_title, title);
        views.setTextViewText(R.id.sadhsangat_subtitle, subtitle);

        // Live badge
        views.setViewVisibility(R.id.sadhsangat_live_badge, isLive ? android.view.View.VISIBLE : android.view.View.GONE);

        // Listeners count
        String listenersText = listeners > 0 ? "👥 " + String.format("%,d", listeners) + " Sangat Listening" : "👥 Sangat Connected";
        views.setTextViewText(R.id.sadhsangat_listeners, listenersText);

        // Play/Pause icon & status
        if (isPlaying) {
            views.setTextViewText(R.id.sadhsangat_play_icon, "⏸");
            views.setTextViewText(R.id.sadhsangat_status, "● Playing Live");
        } else {
            views.setTextViewText(R.id.sadhsangat_play_icon, "▶");
            views.setTextViewText(R.id.sadhsangat_status, "Tap to listen live");
        }

        // Click opens Saadh Sangat Live
        views.setOnClickPendingIntent(R.id.sadhsangat_widget_container,
            createOpenAppIntent(context, "/sadhsangat"));
        views.setOnClickPendingIntent(R.id.sadhsangat_play_button,
            createOpenAppIntent(context, "/sadhsangat"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
