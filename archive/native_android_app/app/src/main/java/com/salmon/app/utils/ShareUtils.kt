package com.salmon.app.utils

import android.content.Context
import android.content.Intent

object ShareUtils {
    fun shareContent(context: Context, title: String, textDetails: String) {
        try {
            val shareMessage = "📌 *$title*\n\n$textDetails\n\n_Dibagikan via Aplikasi Kegiatan Kelurahan Sukamaju_"
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, shareMessage)
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, "Bagikan $title")
            context.startActivity(shareIntent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
