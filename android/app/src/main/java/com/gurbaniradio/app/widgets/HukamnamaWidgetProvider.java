package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.gurbaniradio.app.R;

import org.json.JSONObject;

/**
 * Hukamnama Home Screen Widget
 * Shows today's Hukamnama preview in Gurmukhi
 */
public class HukamnamaWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "hukamnama");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hukamnama_widget);

        // Extract data
        String preview = getSafeString(data, "preview", "Tap to read today's Hukamnama");
        String ang = getSafeString(data, "ang", "");
        String date = getSafeString(data, "date", "");
        boolean isDark = getSafeBoolean(data, "isDark", false);

        // Theme
        int textColor = getThemeTextColor(isDark);
        int secondaryTextColor = getThemeSecondaryTextColor(isDark);

        // Header
        views.setTextViewText(R.id.hukamnama_title, "ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ");
        views.setTextColor(R.id.hukamnama_title, textColor);

        // Date
        if (!date.isEmpty()) {
            views.setTextViewText(R.id.hukamnama_date, date);
        }
        views.setTextColor(R.id.hukamnama_date, secondaryTextColor);

        // Preview text
        String displayPreview = preview.length() > 80 ? preview.substring(0, 77) + "..." : preview;
        views.setTextViewText(R.id.hukamnama_preview, "☬ " + displayPreview);
        views.setTextColor(R.id.hukamnama_preview, textColor);

        // Ang number
        if (!ang.isEmpty()) {
            views.setTextViewText(R.id.hukamnama_ang, "ਅੰਗ " + ang);
            views.setTextColor(R.id.hukamnama_ang, 0xFFFF9500);
        }

        // Click to open Hukamnama
        views.setOnClickPendingIntent(R.id.hukamnama_widget_container,
            createOpenAppIntent(context, "/hukamnama"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
