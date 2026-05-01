package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Gurbani Khoj Search Widget
 * Search bar with recent searches that opens app to search page
 */
public class GurbaniKhojWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "khoj");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.gurbani_khoj_widget);

        boolean isDark = getSafeBoolean(data, "isDark", false);
        String recentSearch = getSafeString(data, "recentSearch", "");
        JSONArray recentSearches = getSafeArray(data, "recentSearches");

        // Search bar text - show recent search if available
        String searchText = recentSearch.isEmpty() ? "ਗੁਰਬਾਣੀ ਖੋਜੋ..." : recentSearch;
        views.setTextViewText(R.id.khoj_search_text, searchText);
        views.setTextColor(R.id.khoj_search_text, getThemeSecondaryTextColor(isDark));

        // Show recent searches count if available
        if (recentSearches != null && recentSearches.length() > 0) {
            views.setTextViewText(R.id.khoj_recent_count, recentSearches.length() + " recent");
        } else {
            views.setTextViewText(R.id.khoj_recent_count, "");
        }

        // Click opens search page
        views.setOnClickPendingIntent(R.id.khoj_widget_container,
            createOpenAppIntent(context, "/gurbani-khoj"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
