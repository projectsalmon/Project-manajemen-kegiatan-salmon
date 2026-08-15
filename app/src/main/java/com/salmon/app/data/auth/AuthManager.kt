package com.salmon.app.data.auth

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.salmon.app.data.models.UserProfile
import com.salmon.app.data.models.UserRole
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.tasks.await
import java.security.MessageDigest
import java.util.UUID

sealed class AuthResult {
    data class Success(val profile: UserProfile, val isNewUser: Boolean = false) : AuthResult()
    data class Error(val message: String, val isCancelled: Boolean = false) : AuthResult()
}

/**
 * Pengelola autentikasi Google Identity menggunakan Android Credential Manager API & Firebase Auth.
 */
class AuthManager(
    private val context: Context,
    private val sessionManager: EncryptedSessionManager
) {
    private val credentialManager = CredentialManager.create(context)
    private val firebaseAuth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    companion object {
        private const val TAG = "AuthManager"
        const val ADMIN_EMAIL = "salmanakhdanhidayat@gmail.com"
    }

    /**
     * Memulai alur Login Google menggunakan Credential Manager API.
     */
    suspend fun signInWithGoogle(
        activityContext: Context,
        serverClientId: String
    ): AuthResult {
        return try {
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(serverClientId)
                .setAutoSelectEnabled(false)
                .build()

            val signInWithGoogleOption = GetSignInWithGoogleOption
                .Builder(serverClientId)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .addCredentialOption(signInWithGoogleOption)
                .build()

            val result = credentialManager.getCredential(
                request = request,
                context = activityContext
            )

            val credential = result.credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                val email = googleIdTokenCredential.id
                val displayName = googleIdTokenCredential.displayName ?: email.substringBefore("@")
                val profilePictureUri = googleIdTokenCredential.profilePictureUri?.toString() ?: ""

                // Hubungkan dengan Firebase Auth jika konfigurasi server tersedia
                val firebaseUid = try {
                    val authCredential = GoogleAuthProvider.getCredential(idToken, null)
                    val authResult = firebaseAuth.signInWithCredential(authCredential).await()
                    authResult.user?.uid ?: "USR-${email.hashCode()}"
                } catch (e: Exception) {
                    Log.w(TAG, "Firebase Auth sign-in with token error (fallback to direct credential): ${e.localizedMessage}")
                    "USR-${Math.abs(email.hashCode())}"
                }

                // Otomatisasi Role Pengguna:
                // Email 'salmanakhdanhidayat@gmail.com' -> Admin (STAF_KELURAHAN)
                // Semua email lain -> Member (WARGA)
                val role = if (email.equals(ADMIN_EMAIL, ignoreCase = true)) {
                    UserRole.STAF_KELURAHAN
                } else {
                    UserRole.WARGA
                }

                val userProfile = UserProfile(
                    id = firebaseUid,
                    name = displayName,
                    email = email,
                    avatarUrl = profilePictureUri,
                    role = role,
                    nik = if (role == UserRole.STAF_KELURAHAN) "3271041998000001" else "3271041208850003",
                    rt = if (role == UserRole.STAF_KELURAHAN) "00" else "03",
                    rw = if (role == UserRole.STAF_KELURAHAN) "00" else "05",
                    kelurahan = "Sukamaju",
                    phone = "0812-9988-7766"
                )

                // Simpan profil & sesi di EncryptedSharedPreferences
                sessionManager.saveSession(userProfile, idToken)

                // Sinkronisasi data ke Cloud Firestore (jika terhubung)
                try {
                    val userDoc = mapOf(
                        "uid" to firebaseUid,
                        "email" to email,
                        "displayName" to displayName,
                        "photoUrl" to profilePictureUri,
                        "role" to if (role == UserRole.STAF_KELURAHAN) "admin" else "member",
                        "lastLoginAt" to System.currentTimeMillis()
                    )
                    firestore.collection("users").document(firebaseUid)
                        .set(userDoc, SetOptions.merge())
                } catch (e: Exception) {
                    Log.w(TAG, "Firestore sync skipped/failed: ${e.localizedMessage}")
                }

                AuthResult.Success(userProfile)
            } else {
                AuthResult.Error("Tipe kredensial tidak dikenali.")
            }
        } catch (e: GetCredentialCancellationException) {
            Log.d(TAG, "Google sign-in cancelled by user")
            AuthResult.Error("Proses masuk dibatalkan. Silakan pilih akun Google Anda untuk melanjutkan ke layanan.", isCancelled = true)
        } catch (e: GetCredentialException) {
            Log.e(TAG, "Credential Manager error: ${e.localizedMessage}", e)
            AuthResult.Error("Gagal menghubungkan akun Google: ${e.localizedMessage}")
        } catch (e: Exception) {
            Log.e(TAG, "General Auth error: ${e.localizedMessage}", e)
            AuthResult.Error(e.localizedMessage ?: "Terjadi kesalahan saat masuk dengan Google.")
        }
    }

    /**
     * Menyediakan GoogleSignInClient standar (requestEmail & requestProfile) yang 100% andal tanpa memblokir akun.
     */
    fun getStandardGoogleSignInClient(activity: Activity): GoogleSignInClient {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .build()
        return GoogleSignIn.getClient(activity, gso)
    }

    /**
     * Menyediakan GoogleSignInClient dengan Server Client ID.
     */
    fun getGoogleSignInClient(activity: Activity, serverClientId: String): GoogleSignInClient {
        val builder = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
        if (serverClientId.isNotBlank() && !serverClientId.startsWith("123456")) {
            try {
                builder.requestIdToken(serverClientId)
            } catch (e: Exception) {
                Log.w(TAG, "requestIdToken skipped: ${e.localizedMessage}")
            }
        }
        return GoogleSignIn.getClient(activity, builder.build())
    }

    /**
     * Memproses hasil GoogleSignInAccount dari Google Play Services Auth.
     */
    suspend fun handleGoogleSignInAccount(account: GoogleSignInAccount): AuthResult {
        val email = account.email ?: "user@gmail.com"
        val displayName = account.displayName ?: email.substringBefore("@")
        val idToken = account.idToken
        val photoUrl = account.photoUrl?.toString() ?: ""

        val firebaseUid = try {
            if (!idToken.isNullOrEmpty()) {
                val credential = GoogleAuthProvider.getCredential(idToken, null)
                val authResult = firebaseAuth.signInWithCredential(credential).await()
                authResult.user?.uid ?: "USR-${email.hashCode()}"
            } else {
                "USR-${Math.abs(email.hashCode())}"
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firebase Auth error: ${e.localizedMessage}")
            "USR-${Math.abs(email.hashCode())}"
        }

        // Cek apakah akun ini sudah memiliki role yang ditentukan oleh Admin di Firestore
        var role = if (email.equals(ADMIN_EMAIL, ignoreCase = true)) {
            UserRole.STAF_KELURAHAN
        } else {
            UserRole.WARGA
        }
        var rt = "03"
        var rw = "05"
        var customAvatarUrl = photoUrl
        var hasExistingDoc = false

        try {
            // 1. Cek berdasarkan UID
            val userDocSnapshot = firestore.collection("users").document(firebaseUid).get().await()
            if (userDocSnapshot.exists()) {
                hasExistingDoc = true
                val savedRoleStr = userDocSnapshot.getString("userRole") ?: userDocSnapshot.getString("role")
                if (!savedRoleStr.isNullOrEmpty()) {
                    role = try {
                        UserRole.valueOf(savedRoleStr)
                    } catch (e: Exception) {
                        if (savedRoleStr.equals("admin", ignoreCase = true) || email.equals(ADMIN_EMAIL, ignoreCase = true)) {
                            UserRole.STAF_KELURAHAN
                        } else {
                            UserRole.WARGA
                        }
                    }
                }
                rt = userDocSnapshot.getString("rt") ?: rt
                rw = userDocSnapshot.getString("rw") ?: rw
                customAvatarUrl = userDocSnapshot.getString("avatarUrl") ?: userDocSnapshot.getString("photoUrl") ?: photoUrl
            } else {
                // 2. Cek berdasarkan Email jika UID berbeda
                val emailQuery = firestore.collection("users").whereEqualTo("email", email).get().await()
                if (!emailQuery.isEmpty) {
                    hasExistingDoc = true
                    val firstDoc = emailQuery.documents.first()
                    val savedRoleStr = firstDoc.getString("userRole") ?: firstDoc.getString("role")
                    if (!savedRoleStr.isNullOrEmpty()) {
                        role = try {
                            UserRole.valueOf(savedRoleStr)
                        } catch (e: Exception) {
                            if (savedRoleStr.equals("admin", ignoreCase = true) || email.equals(ADMIN_EMAIL, ignoreCase = true)) {
                                UserRole.STAF_KELURAHAN
                            } else {
                                UserRole.WARGA
                            }
                        }
                    }
                    rt = firstDoc.getString("rt") ?: rt
                    rw = firstDoc.getString("rw") ?: rw
                    customAvatarUrl = firstDoc.getString("avatarUrl") ?: firstDoc.getString("photoUrl") ?: photoUrl
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to read existing user role from Firestore: ${e.localizedMessage}")
        }

        val userProfile = UserProfile(
            id = firebaseUid,
            name = displayName,
            nik = if (role == UserRole.STAF_KELURAHAN) "3201012345670001" else "3201019876540002",
            role = role,
            rt = rt,
            rw = rw,
            kelurahan = "Sukamaju",
            phone = "0812-3456-7890",
            email = email,
            avatarUrl = customAvatarUrl
        )

        sessionManager.saveSession(userProfile, idToken)

        try {
            val userDoc = hashMapOf<String, Any>(
                "uid" to firebaseUid,
                "id" to firebaseUid,
                "email" to email,
                "displayName" to displayName,
                "name" to displayName,
                "photoUrl" to customAvatarUrl,
                "avatarUrl" to customAvatarUrl,
                "kelurahan" to "Sukamaju",
                "phone" to userProfile.phone,
                "nik" to userProfile.nik,
                "lastLoginAt" to System.currentTimeMillis()
            )

            // Simpan role ke Firestore hanya jika akun baru pertama kali dibuat atau memang admin root
            if (!hasExistingDoc || email.equals(ADMIN_EMAIL, ignoreCase = true)) {
                userDoc["role"] = if (role == UserRole.STAF_KELURAHAN) "admin" else "member"
                userDoc["userRole"] = role.name
                userDoc["rt"] = rt
                userDoc["rw"] = rw
            }

            firestore.collection("users").document(firebaseUid)
                .set(userDoc, SetOptions.merge())
        } catch (e: Exception) {
            Log.w(TAG, "Firestore sync error: ${e.localizedMessage}")
        }

        return AuthResult.Success(userProfile)
    }

    /**
     * Memeriksa dan memulihkan sesi aktif (Auto-Login).
     */
    fun checkAutoLogin(): UserProfile? {
        val cachedProfile = sessionManager.getSavedProfile()
        if (cachedProfile != null) {
            val firebaseUser = try { firebaseAuth.currentUser } catch (e: Exception) { null }
            if (firebaseUser != null && firebaseUser.email != null) {
                val email = firebaseUser.email ?: cachedProfile.email
                val role = if (email.equals(ADMIN_EMAIL, ignoreCase = true)) {
                    UserRole.STAF_KELURAHAN
                } else {
                    cachedProfile.role
                }
                return cachedProfile.copy(
                    id = firebaseUser.uid,
                    email = email,
                    role = role
                )
            }
            return cachedProfile
        }
        return null
    }

    /**
     * Melakukan proses Sign-Out dan membersihkan seluruh state sesi lokal.
     */
    suspend fun signOut(): Boolean {
        return try {
            try {
                firebaseAuth.signOut()
            } catch (e: Exception) {
                Log.w(TAG, "FirebaseAuth signOut error: ${e.localizedMessage}")
            }
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
            } catch (e: Exception) {
                Log.w(TAG, "CredentialManager clear error: ${e.localizedMessage}")
            }
            sessionManager.clearSession()
            true
        } catch (e: Exception) {
            Log.e(TAG, "SignOut error: ${e.localizedMessage}", e)
            false
        }
    }

    /**
     * Login instan untuk mode demo/pengujian role cepat.
     */
    fun signInAsDemoRole(role: UserRole, customEmail: String? = null): UserProfile {
        val email = customEmail ?: when (role) {
            UserRole.STAF_KELURAHAN -> ADMIN_EMAIL
            UserRole.RT -> "rt03@sukamaju.id"
            UserRole.RW -> "rw05@sukamaju.id"
            UserRole.POSYANDU -> "posyandu@sukamaju.id"
            UserRole.WARGA -> "warga@sukamaju.id"
        }

        val effectiveRole = if (email.equals(ADMIN_EMAIL, ignoreCase = true)) {
            UserRole.STAF_KELURAHAN
        } else {
            role
        }

        val name = when (effectiveRole) {
            UserRole.STAF_KELURAHAN -> "Salman Akhdan Hidayat (Admin)"
            UserRole.RT -> "Bambang Wijaya (Ketua RT 03)"
            UserRole.RW -> "Sutrisno (Ketua RW 05)"
            UserRole.POSYANDU -> "Ibu Ningsih (Kader Posyandu)"
            UserRole.WARGA -> "Budi Santoso (Warga)"
        }

        val profile = UserProfile(
            id = "DEMO-${effectiveRole.code}",
            name = name,
            email = email,
            role = effectiveRole,
            nik = if (effectiveRole == UserRole.STAF_KELURAHAN) "3271041998000001" else "3271041208850003",
            rt = if (effectiveRole == UserRole.STAF_KELURAHAN) "00" else "03",
            rw = if (effectiveRole == UserRole.STAF_KELURAHAN) "00" else "05",
            kelurahan = "Sukamaju",
            phone = "0812-3456-7890",
            avatarUrl = ""
        )

        sessionManager.saveSession(profile)
        return profile
    }
}
