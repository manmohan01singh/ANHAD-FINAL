package com.gurbaniradio.app.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import com.gurbaniradio.app.MainActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Base class for all Anhad widgets providing common functionality
 */
public abstract class BaseWidgetProvider extends AppWidgetProvider {

    protected static final String WIDGET_PREFS = "anhad_widgets";
    protected static final String ACTION_WIDGET_CLICK = "com.gurbaniradio.app.widgets.CLICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    protected abstract void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId);

    protected JSONObject getWidgetData(Context context, String widgetType) {
        SharedPreferences prefs = context.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE);
        String jsonString = prefs.getString(widgetType + "_data", "{}");
        try {
            return new JSONObject(jsonString);
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    protected PendingIntent createOpenAppIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("route", route);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    protected String getSafeString(JSONObject obj, String key, String defaultValue) {
        try {
            return obj.optString(key, defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    protected int getSafeInt(JSONObject obj, String key, int defaultValue) {
        try {
            return obj.optInt(key, defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    protected boolean getSafeBoolean(JSONObject obj, String key, boolean defaultValue) {
        try {
            return obj.optBoolean(key, defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    protected JSONArray getSafeArray(JSONObject obj, String key) {
        try {
            return obj.optJSONArray(key);
        } catch (Exception e) {
            return null;
        }
    }

    protected String formatDuration(int seconds) {
        if (seconds < 60) return seconds + "s";
        if (seconds < 3600) return (seconds / 60) + "m";
        int hours = seconds / 3600;
        int mins = (seconds % 3600) / 60;
        return mins > 0 ? hours + "h " + mins + "m" : hours + "h";
    }

    protected int getThemeBackground(boolean isDark) {
        return isDark ? 0xFF1C1C1E : 0xFFFFFFFF;
    }

    protected int getThemeTextColor(boolean isDark) {
        return isDark ? 0xFFFFFFFF : 0xFF1C1C1E;
    }

    protected int getThemeSecondaryTextColor(boolean isDark) {
        return isDark ? 0xB3FFFFFF : 0xB33C3C43;
    }
}
