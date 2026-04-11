package com.gurbaniradio.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/**
 * Capacitor Plugin for syncing widget data from WebView to Native widgets
 */
@CapacitorPlugin(name = "WidgetDataBridge")
public class WidgetDataBridgePlugin extends Plugin {

    private static final String WIDGET_PREFS = "anhad_widgets";

    @PluginMethod
    public void syncWidgetData(PluginCall call) {
        try {
            String widgetType = call.getString("widgetType");
            JSObject data = call.getObject("data");

            if (widgetType == null || data == null) {
                call.reject("Missing widgetType or data");
                return;
            }

            // Save to SharedPreferences
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE);
            prefs.edit()
                .putString(widgetType + "_data", data.toString())
                .putLong(widgetType + "_updated", System.currentTimeMillis())
                .apply();

            // Trigger widget update
            updateWidget(context, widgetType);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("widgetType", widgetType);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error syncing widget data: " + e.getMessage());
        }
    }

    @PluginMethod
    public void syncAllWidgets(PluginCall call) {
        try {
            Context context = getContext();
            String[] widgetTypes = {"nitnem", "naamabhyas", "kirtan", "calendar"};

            for (String widgetType : widgetTypes) {
                updateWidget(context, widgetType);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("synced", widgetTypes.length);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error syncing all widgets: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestWidgetUpdate(PluginCall call) {
        try {
            String widgetType = call.getString("widgetType");
            if (widgetType == null) {
                call.reject("Missing widgetType");
                return;
            }

            updateWidget(getContext(), widgetType);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error requesting widget update: " + e.getMessage());
        }
    }

    private void updateWidget(Context context, String widgetType) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        Class<?> providerClass = getWidgetProviderClass(widgetType);

        if (providerClass != null) {
            ComponentName provider = new ComponentName(context, providerClass);
            int[] appWidgetIds = manager.getAppWidgetIds(provider);

            if (appWidgetIds.length > 0) {
                // Send update broadcast
                Intent intent = new Intent(context, providerClass);
                intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds);
                context.sendBroadcast(intent);
            }
        }
    }

    private Class<?> getWidgetProviderClass(String widgetType) {
        switch (widgetType) {
            case "nitnem":
                return NitnemWidgetProvider.class;
            case "naamabhyas":
                return NaamAbhyasWidgetProvider.class;
            case "kirtan":
                return KirtanWidgetProvider.class;
            case "calendar":
                return CalendarWidgetProvider.class;
            default:
                return null;
        }
    }
}
