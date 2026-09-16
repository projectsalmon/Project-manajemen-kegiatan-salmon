package com.salmon.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.salmon.app.MainActivity
import com.salmon.app.R
import org.json.JSONArray

class KegiatanWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        super.onUpdate(context, appWidgetManager, appWidgetIds)
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.kegiatan_widget_layout)

            // Cache-busting URI with timestamp forces Android to discard stale RemoteViewsFactory cache
            val serviceIntent = Intent(context, KegiatanWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse("content://com.salmon.app.widget/$appWidgetId/${System.currentTimeMillis()}")
            }
            views.setRemoteAdapter(R.id.widget_list_view, serviceIntent)
            views.setEmptyView(R.id.widget_list_view, R.id.widget_empty_view)

            // Dynamic date header in Indonesian locale (e.g. "SELASA, 15 SEPTEMBER")
            try {
                val localeID = java.util.Locale("id", "ID")
                val sdf = java.text.SimpleDateFormat("EEEE, d MMMM", localeID)
                val formattedDate = sdf.format(java.util.Date()).uppercase(localeID)
                views.setTextViewText(R.id.widget_date_text, formattedDate)
            } catch (e: Exception) {
                views.setTextViewText(R.id.widget_date_text, "HARI INI")
            }

            // Dynamic counter badge
            try {
                val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
                val jsonStr = prefs.getString("widget_items_json", "[]") ?: "[]"
                val count = JSONArray(jsonStr).length()
                views.setTextViewText(
                    R.id.widget_counter_badge,
                    if (count > 0) "$count AGENDA" else "KOSONG"
                )
            } catch (e: Exception) {
                views.setTextViewText(R.id.widget_counter_badge, "AGENDA")
            }

            // PendingIntent Template for item clicks in the ListView
            val itemClickIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val itemClickPendingIntent = PendingIntent.getActivity(
                context,
                0,
                itemClickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_list_view, itemClickPendingIntent)

            // Open app button
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                1,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_open_app, openAppPendingIntent)

            // Refresh button
            val refreshIntent = Intent(context, KegiatanWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                2,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_refresh, refreshPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_list_view)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, KegiatanWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            if (allWidgetIds != null && allWidgetIds.isNotEmpty()) {
                for (widgetId in allWidgetIds) {
                    updateAppWidget(context, appWidgetManager, widgetId)
                }
                appWidgetManager.notifyAppWidgetViewDataChanged(allWidgetIds, R.id.widget_list_view)

                // Explicitly send ACTION_APPWIDGET_UPDATE broadcast with all widget IDs
                val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                    component = thisWidget
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, allWidgetIds)
                }
                context.sendBroadcast(updateIntent)
            }
        }
    }
}
