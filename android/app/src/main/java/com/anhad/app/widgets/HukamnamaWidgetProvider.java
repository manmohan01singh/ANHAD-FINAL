package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Daily Hukamnama Sahib Home Screen Widget
 * Shows today's sacred Hukamnama from Sachkhand Sri Harmandir Sahib with Ang badge
 */
public class HukamnamaWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "hukamnama");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hukamnama_widget);

        // Extract data
        String preview = getSafeString(data, "preview", "ਸੋਰਠਿ ਮਹਲਾ ੫ ॥ ਗਏ ਕਲੇਸ ਰੋਗ ਸਭਿ ਨਾਸੇ ਪ੍ਰਭਿ ਅਪੁਨੈ ਕਿਰਪਾ ਧਾਰੀ ॥");
        String ang = getSafeString(data, "ang", "੬੮੪");
        String date = getSafeString(data, "date", "");
        String author = getSafeString(data, "author", "");

        // Header
        views.setTextViewText(R.id.hukamnama_title, "ਅੱਜ ਦਾ ਮੁੱਖਵਾਕ");

        // Ang badge
        if (!ang.isEmpty()) {
            views.setTextViewText(R.id.hukamnama_ang, "ਅੰਗ " + ang);
        } else {
            views.setTextViewText(R.id.hukamnama_ang, "ਸੱਚਖੰਡ");
        }

        // Date / Source
        if (!date.isEmpty()) {
            views.setTextViewText(R.id.hukamnama_date, date);
        } else {
            SimpleDateFormat sdf = new SimpleDateFormat("EEEE, d MMMM • ਸ੍ਰੀ ਦਰਬਾਰ ਸਾਹਿਬ", Locale.getDefault());
            views.setTextViewText(R.id.hukamnama_date, sdf.format(new Date()));
        }

        // Preview Mukhwak text
        views.setTextViewText(R.id.hukamnama_preview, preview);

        // Click opens Daily Hukamnama page
        views.setOnClickPendingIntent(R.id.hukamnama_widget_container,
            createOpenAppIntent(context, "/hukamnama"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
