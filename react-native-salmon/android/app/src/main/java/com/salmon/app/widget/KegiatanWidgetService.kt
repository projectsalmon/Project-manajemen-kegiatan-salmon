package com.salmon.app.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.salmon.app.R
import org.json.JSONArray
import org.json.JSONObject

class KegiatanWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return KegiatanWidgetItemFactory(applicationContext)
    }
}

class KegiatanWidgetItemFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    private val items = ArrayList<JSONObject>()

    override fun onCreate() {
        loadData()
    }

    override fun onDataSetChanged() {
        loadData()
    }

    private fun loadData() {
        items.clear()
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("widget_items_json", "[]") ?: "[]"
        try {
            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                items.add(jsonArray.getJSONObject(i))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        items.clear()
    }

    override fun getCount(): Int = items.size

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.kegiatan_widget_item)
        if (position >= items.size) return views

        val item = items[position]
        val id = item.optString("id", "")
        val title = item.optString("title", "Agenda Warga")
        val subtitle = item.optString("subtitle", "")
        val type = item.optString("type", "KEGIATAN")
        val isPinned = item.optBoolean("isPinned", false)

        views.setTextViewText(R.id.item_title, title)
        views.setTextViewText(R.id.item_subtitle, subtitle)

        if (type.equals("PENGUMUMAN", ignoreCase = true)) {
            views.setTextViewText(R.id.item_badge, if (isPinned) "📌 PENGUMUMAN" else "📢 PENGUMUMAN")
        } else {
            views.setTextViewText(R.id.item_badge, if (isPinned) "📌 KEGIATAN" else "📅 KEGIATAN")
        }

        // Fill-in intent for item click with deep link URI
        val itemType = if (type.equals("PENGUMUMAN", ignoreCase = true)) "ANNOUNCEMENT" else "ACTIVITY"
        val deepLinkUri = Uri.parse("com.salmon.app://detail?type=$itemType&id=$id")
        val fillInIntent = Intent().apply {
            action = Intent.ACTION_VIEW
            data = deepLinkUri
            putExtra("type", itemType)
            putExtra("id", id)
        }
        views.setOnClickFillInIntent(R.id.widget_item_container, fillInIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
