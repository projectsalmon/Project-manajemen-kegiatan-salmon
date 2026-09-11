package com.salmon.app.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream

object ImageUtils {
    private const val TAG = "ImageUtils"
    private const val MAX_DIMENSION = 640
    private const val JPEG_QUALITY = 65

    /**
     * Mengubah Uri gambar lokal menjadi Base64 Data URI yang terkompresi.
     * Siap disimpan ke Firestore dan dirender oleh Coil AsyncImage.
     */
    fun uriToBase64(context: Context, uri: Uri): String? {
        return try {
            val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val source = ImageDecoder.createSource(context.contentResolver, uri)
                ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                    decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                    val width = info.size.width
                    val height = info.size.height
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        val ratio = width.toFloat() / height.toFloat()
                        if (ratio > 1) {
                            decoder.setTargetSize(MAX_DIMENSION, (MAX_DIMENSION / ratio).toInt())
                        } else {
                            decoder.setTargetSize((MAX_DIMENSION * ratio).toInt(), MAX_DIMENSION)
                        }
                    }
                }
            } else {
                val inputStream = context.contentResolver.openInputStream(uri)
                val original = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()

                if (original != null && (original.width > MAX_DIMENSION || original.height > MAX_DIMENSION)) {
                    val ratio = original.width.toFloat() / original.height.toFloat()
                    val targetWidth: Int
                    val targetHeight: Int
                    if (ratio > 1) {
                        targetWidth = MAX_DIMENSION
                        targetHeight = (MAX_DIMENSION / ratio).toInt()
                    } else {
                        targetWidth = (MAX_DIMENSION * ratio).toInt()
                        targetHeight = MAX_DIMENSION
                    }
                    Bitmap.createScaledBitmap(original, targetWidth, targetHeight, true)
                } else {
                    original
                }
            }

            if (bitmap == null) return null

            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, outputStream)
            val byteArray = outputStream.toByteArray()
            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64String"
        } catch (e: Exception) {
            Log.e(TAG, "Error converting uri to base64: ${e.localizedMessage}", e)
            null
        }
    }
}
