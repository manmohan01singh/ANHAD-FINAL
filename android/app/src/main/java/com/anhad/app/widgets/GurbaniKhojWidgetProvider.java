package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Gurbani Khoj Search Home Screen Widget (iOS Spotlight Style)
 * Quick search capsule for instant Gurbani exploration
 */
public class GurbaniKhojWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "khoj");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.gurbani_khoj_widget);

        String recentSearch = getSafeString(data, "recentSearch", "");
        JSONArray recentSearches = getSafeArray(data, "recentSearches");

        // Search text
        if (!recentSearch.isEmpty()) {
            views.setTextViewText(R.id.khoj_search_text, "ਖੋਜ: " + recentSearch);
        } else {
            views.setTextViewText(R.id.khoj_search_text, "ਗੁਰਬਾਣੀ ਖੋਜੋ • Search Gurbani...");
        }

        // Recent count or search badge
        if (recentSearches != null && recentSearches.length() > 0) {
            views.setTextViewText(R.id.khoj_recent_count, recentSearches.length() + " recent");
        } else {
            views.setTextViewText(R.id.khoj_recent_count, "☬ Khoj");
        }

        // Click opens Gurbani Khoj
        views.setOnClickPendingIntent(R.id.khoj_widget_container,
            createOpenAppIntent(context, "/gurbani-khoj"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
