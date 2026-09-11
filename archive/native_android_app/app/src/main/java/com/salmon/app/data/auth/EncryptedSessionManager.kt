package com.salmon.app.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.salmon.app.data.models.UserProfile
import com.salmon.app.data.models.UserRole

/**
 * Manajer sesi aman yang menyimpan kredensial dan role pengguna di EncryptedSharedPreferences (AES256).
 */
class EncryptedSessionManager(context: Context) {

    private val sharedPreferences: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Fallback untuk perangkat lama atau kompatibilitas pengujian
        context.getSharedPreferences(PREFS_NAME + "_fallback", Context.MODE_PRIVATE)
    }

    companion object {
        private const val PREFS_NAME = "secure_user_session"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_USER_ID = "key_user_id"
        private const val KEY_USER_NAME = "key_user_name"
        private const val KEY_USER_EMAIL = "key_user_email"
        private const val KEY_USER_PHOTO_URL = "key_user_photo_url"
        private const val KEY_USER_ROLE = "key_user_role"
        private const val KEY_ID_TOKEN = "key_id_token"
        private const val KEY_USER_NIK = "key_user_nik"
        private const val KEY_USER_RT = "key_user_rt"
        private const val KEY_USER_RW = "key_user_rw"
        private const val KEY_USER_KELURAHAN = "key_user_kelurahan"
        private const val KEY_USER_PHONE = "key_user_phone"

        const val ADMIN_EMAIL = "salmanakhdanhidayat@gmail.com"
    }

    /**
     * Menyimpan data sesi login dan profil pengguna ke penyimpanan terenkripsi.
     */
    fun saveSession(
        profile: UserProfile,
        idToken: String? = null
    ) {
        sharedPreferences.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_USER_ID, profile.id)
            putString(KEY_USER_NAME, profile.name)
            putString(KEY_USER_EMAIL, profile.email)
            putString(KEY_USER_PHOTO_URL, profile.avatarUrl)
            putString(KEY_USER_ROLE, profile.role.name)
            putString(KEY_USER_NIK, profile.nik)
            putString(KEY_USER_RT, profile.rt)
            putString(KEY_USER_RW, profile.rw)
            putString(KEY_USER_KELURAHAN, profile.kelurahan)
            putString(KEY_USER_PHONE, profile.phone)
            if (idToken != null) {
                putString(KEY_ID_TOKEN, idToken)
            }
            apply()
        }
    }

    /**
     * Mengambil profil pengguna yang tersimpan jika sesi masih aktif.
     */
    fun getSavedProfile(): UserProfile? {
        if (!isLoggedIn()) return null
        val id = sharedPreferences.getString(KEY_USER_ID, null) ?: return null
        val email = sharedPreferences.getString(KEY_USER_EMAIL, "") ?: ""
        val name = sharedPreferences.getString(KEY_USER_NAME, "Pengguna Google") ?: "Pengguna Google"
        val photoUrl = sharedPreferences.getString(KEY_USER_PHOTO_URL, "") ?: ""
        val roleStr = sharedPreferences.getString(KEY_USER_ROLE, null)

        // Otomatisasi role: Jika email salmanakhdanhidayat@gmail.com -> Admin (STAF_KELURAHAN), lainnya -> Member (WARGA)
        val role = when {
            email.equals(ADMIN_EMAIL, ignoreCase = true) -> UserRole.STAF_KELURAHAN
            roleStr != null -> try {
                UserRole.valueOf(roleStr)
            } catch (e: Exception) {
                UserRole.WARGA
            }
            else -> UserRole.WARGA
        }

        return UserProfile(
            id = id,
            name = name,
            email = email,
            avatarUrl = photoUrl,
            role = role,
            nik = sharedPreferences.getString(KEY_USER_NIK, "3271041208850003") ?: "3271041208850003",
            rt = sharedPreferences.getString(KEY_USER_RT, "03") ?: "03",
            rw = sharedPreferences.getString(KEY_USER_RW, "05") ?: "05",
            kelurahan = sharedPreferences.getString(KEY_USER_KELURAHAN, "Sukamaju") ?: "Sukamaju",
            phone = sharedPreferences.getString(KEY_USER_PHONE, "0812-3456-7890") ?: "0812-3456-7890"
        )
    }

    /**
     * Memeriksa apakah ada sesi pengguna yang sedang aktif.
     */
    fun isLoggedIn(): Boolean {
        return sharedPreferences.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    /**
     * Mengambil ID Token aktif jika tersedia.
     */
    fun getIdToken(): String? {
        return sharedPreferences.getString(KEY_ID_TOKEN, null)
    }

    /**
     * Menghapus seluruh data sesi pengguna terenkripsi saat sign-out.
     */
    fun clearSession() {
        sharedPreferences.edit().clear().apply()
    }
}
