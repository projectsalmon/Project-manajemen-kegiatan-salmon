package com.salmon.app.widget

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class WidgetUpdateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetUpdateModule"

    @ReactMethod
    fun updateWidgetList(itemsJson: String) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("widget_items_json", itemsJson)
                .apply()

            KegiatanWidgetProvider.updateAllWidgets(reactApplicationContext)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun updateWidgetData(title: String, date: String, type: String) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("widget_title", title)
                .putString("widget_date", date)
                .putString("widget_type", type)
                .apply()

            KegiatanWidgetProvider.updateAllWidgets(reactApplicationContext)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun updateWidget(title: String, date: String, type: String) {
        updateWidgetData(title, date, type)
    }

    /**
     * Share activity/announcement to WhatsApp with Image Thumbnail and Text
     */
    @ReactMethod
    fun shareToWhatsAppWithImage(imageUrl: String, message: String, promise: Promise) {
        thread {
            try {
                val context = reactApplicationContext
                var imageFile: File? = null

                if (imageUrl.startsWith("data:image")) {
                    val base64Data = imageUrl.substringAfter(",")
                    val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                    val file = File(context.cacheDir, "share_thumbnail.jpg")
                    FileOutputStream(file).use { out ->
                        out.write(decodedBytes)
                    }
                    imageFile = file
                } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                    val url = URL(imageUrl)
                    val connection = url.openConnection() as HttpURLConnection
                    connection.doInput = true
                    connection.connect()
                    val input = connection.inputStream
                    val bitmap = BitmapFactory.decodeStream(input)
                    if (bitmap != null) {
                        val file = File(context.cacheDir, "share_thumbnail.jpg")
                        FileOutputStream(file).use { out ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                        }
                        imageFile = file
                    }
                } else if (imageUrl.startsWith("file://")) {
                    imageFile = File(Uri.parse(imageUrl).path ?: "")
                }

                if (imageFile != null && imageFile.exists()) {
                    val contentUri: Uri = FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.shareprovider",
                        imageFile
                    )

                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "image/*"
                        putExtra(Intent.EXTRA_STREAM, contentUri)
                        putExtra(Intent.EXTRA_TEXT, message)
                        setPackage("com.whatsapp")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }

                    try {
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        // WhatsApp not installed directly, fallback to system chooser
                        val chooser = Intent.createChooser(
                            intent.apply { `package` = null },
                            "Bagikan Kegiatan"
                        )
                        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(chooser)
                    }
                    promise.resolve(true)
                } else {
                    // Fallback to text share
                    val textIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, message)
                        setPackage("com.whatsapp")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    try {
                        context.startActivity(textIntent)
                    } catch (e: Exception) {
                        val chooser = Intent.createChooser(
                            textIntent.apply { `package` = null },
                            "Bagikan Kegiatan"
                        )
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(chooser)
                    }
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                promise.reject("SHARE_ERROR", e.message, e)
            }
        }
    }
}
