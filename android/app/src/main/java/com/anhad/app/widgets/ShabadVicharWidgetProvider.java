package com.anhad.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import com.anhad.app.R;

import org.json.JSONObject;

/**
 * Shabad Vichar Home Screen Widget (Apple Books iOS Contemplation Style)
 * Shows daily Shabad of the day with Gurmukhi verse and English meaning
 */
public class ShabadVicharWidgetProvider extends BaseWidgetProvider {

    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        JSONObject data = getWidgetData(context, "shabad_vichar");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.shabad_vichar_widget);

        // Extract data
        String gurmukhi = getSafeString(data, "gurmukhi", "ਗੁਰ ਪਰਸਾਦੀ ਵਿਦਿਆ ਵੀਚਾਰੈ ਪਰਉਪਕਾਰੀ ਹੋਵੈ ॥");
        String translation = getSafeString(data, "translation", "By Guru's Grace one contemplates spiritual wisdom, and becomes a benefactor to all.");
        String author = getSafeString(data, "author", "ਮਹਲਾ ੧");
        String ang = getSafeString(data, "ang", "12");

        // Author & Ang badge
        String badgeText = (!author.isEmpty() && !ang.isEmpty()) ? author + " • Ang " + ang : (!ang.isEmpty() ? "Ang " + ang : "Shabad Vichar");
        views.setTextViewText(R.id.shabad_author_ang, badgeText);

        // Verses
        views.setTextViewText(R.id.shabad_gurmukhi, gurmukhi);
        views.setTextViewText(R.id.shabad_translation, translation);

        // Click opens Shabad Vichar
        views.setOnClickPendingIntent(R.id.shabad_widget_container,
            createOpenAppIntent(context, "/shabad-vichar"));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
