package com.salmon.app.data.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.salmon.app.data.models.*
import kotlinx.coroutines.tasks.await

/**
 * Repositori Cloud Firestore untuk pertukaran data real-time antar perangkat.
 */
class FirestoreRepository {

    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }
    private val firebaseAuth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }

    companion object {
        private const val TAG = "FirestoreRepository"
        private const val COLLECTION_ACTIVITIES = "activities"
        private const val COLLECTION_ANNOUNCEMENTS = "announcements"
        private const val COLLECTION_USERS = "users"
        private const val COLLECTION_RSVPS = "rsvps"
    }

    /**
     * Memastikan perangkat terotentikasi di Firebase (Anonymous fallback jika belum ada token).
     */
    suspend fun ensureAuthenticated() {
        if (firebaseAuth.currentUser == null) {
            try {
                firebaseAuth.signInAnonymously().await()
                Log.d(TAG, "Authenticated anonymously for Firestore: ${firebaseAuth.currentUser?.uid}")
            } catch (e: Exception) {
                Log.w(TAG, "Anonymous auth skipped/failed: ${e.localizedMessage}")
            }
        }
    }

    /**
     * Berlangganan (Real-time listener) daftar kegiatan dari Cloud Firestore.
     */
    fun listenToActivities(
        currentUserId: String,
        onUpdate: (List<ActivityItem>) -> Unit,
        onError: ((Exception) -> Unit)? = null
    ): ListenerRegistration {
        return firestore.collection(COLLECTION_ACTIVITIES)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Error listening to activities: ${error.localizedMessage}", error)
                    onError?.invoke(error)
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val items = mutableListOf<ActivityItem>()
                    for (doc in snapshot.documents) {
                        try {
                            val id = doc.id
                            val title = doc.getString("title") ?: continue
                            val description = doc.getString("description") ?: ""
                            val categoryStr = doc.getString("category") ?: ActivityCategory.SOSIAL.name
                            val category = try { ActivityCategory.valueOf(categoryStr) } catch (e: Exception) { ActivityCategory.SOSIAL }
                            val dateIso = doc.getString("dateIso") ?: ""
                            val formattedDate = doc.getString("formattedDate") ?: ""
                            val timeSlot = doc.getString("timeSlot") ?: ""
                            val locationName = doc.getString("locationName") ?: ""
                            val locationAddress = doc.getString("locationAddress") ?: ""
                            val latitude = doc.getDouble("latitude") ?: -6.200000
                            val longitude = doc.getDouble("longitude") ?: 106.816666
                            val targetRegion = doc.getString("targetRegion") ?: "RT 03 / RW 05"
                            val organizerRoleStr = doc.getString("organizerRole") ?: UserRole.WARGA.name
                            val organizerRole = try { UserRole.valueOf(organizerRoleStr) } catch (e: Exception) { UserRole.WARGA }
                            val organizerName = doc.getString("organizerName") ?: "Warga"
                            val userId = doc.getString("userId") ?: ""
                            val creatorEmail = doc.getString("creatorEmail") ?: ""
                            val confirmedCount = doc.getLong("confirmedCount")?.toInt() ?: 0
                            val maybeCount = doc.getLong("maybeCount")?.toInt() ?: 0
                            val quota = doc.getLong("quota")?.toInt()
                            val approvalStatusStr = doc.getString("approvalStatus") ?: ApprovalStatus.PUBLISHED.name
                            val approvalStatus = try { ApprovalStatus.valueOf(approvalStatusStr) } catch (e: Exception) { ApprovalStatus.PUBLISHED }
                            val needsFollowUp = doc.getBoolean("needsFollowUp") ?: false
                            val followUpNote = doc.getString("followUpNote")
                            val isFeatured = doc.getBoolean("isFeatured") ?: false
                            val imageUrl = doc.getString("imageUrl")

                            @Suppress("UNCHECKED_CAST")
                            val attendeesMap = doc.get("attendees") as? Map<String, String> ?: emptyMap()
                            val myRsvpStr = attendeesMap[currentUserId]
                            val userRsvpStatus = if (myRsvpStr != null) {
                                try { RsvpStatus.valueOf(myRsvpStr) } catch (e: Exception) { RsvpStatus.NONE }
                            } else {
                                RsvpStatus.NONE
                            }

                            items.add(
                                ActivityItem(
                                    id = id,
                                    title = title,
                                    description = description,
                                    category = category,
                                    dateIso = dateIso,
                                    formattedDate = formattedDate,
                                    timeSlot = timeSlot,
                                    locationName = locationName,
                                    locationAddress = locationAddress,
                                    latitude = latitude,
                                    longitude = longitude,
                                    targetRegion = targetRegion,
                                    organizerRole = organizerRole,
                                    organizerName = organizerName,
                                    userId = userId,
                                    creatorEmail = creatorEmail,
                                    confirmedCount = confirmedCount,
                                    maybeCount = maybeCount,
                                    quota = quota,
                                    userRsvpStatus = userRsvpStatus,
                                    approvalStatus = approvalStatus,
                                    needsFollowUp = needsFollowUp,
                                    followUpNote = followUpNote,
                                    isFeatured = isFeatured,
                                    imageUrl = imageUrl
                                )
                            )
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to parse activity doc ${doc.id}: ${e.localizedMessage}")
                        }
                    }
                    onUpdate(items)
                }
            }
    }

    /**
     * Berlangganan (Real-time listener) daftar pengumuman dari Cloud Firestore.
     */
    fun listenToAnnouncements(
        onUpdate: (List<AnnouncementItem>) -> Unit,
        onError: ((Exception) -> Unit)? = null
    ): ListenerRegistration {
        return firestore.collection(COLLECTION_ANNOUNCEMENTS)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Error listening to announcements: ${error.localizedMessage}", error)
                    onError?.invoke(error)
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val items = mutableListOf<AnnouncementItem>()
                    for (doc in snapshot.documents) {
                        try {
                            val id = doc.id
                            val title = doc.getString("title") ?: continue
                            val content = doc.getString("content") ?: ""
                            val formattedDate = doc.getString("formattedDate") ?: ""
                            val authorName = doc.getString("authorName") ?: "Staf Kelurahan"
                            val authorRole = doc.getString("authorRole") ?: "Staf Kelurahan"
                            val targetRegion = doc.getString("targetRegion") ?: "Semua Warga"
                            val urgencyStr = doc.getString("urgency") ?: AnnouncementUrgency.INFO.name
                            val urgency = try { AnnouncementUrgency.valueOf(urgencyStr) } catch (e: Exception) { AnnouncementUrgency.INFO }
                            
                            @Suppress("UNCHECKED_CAST")
                            val requirements = doc.get("requirements") as? List<String> ?: emptyList()
                            val additionalInfo = doc.getString("additionalInfo")
                            val imageUrl = doc.getString("imageUrl")
                            val approvalStatusStr = doc.getString("approvalStatus") ?: ApprovalStatus.PUBLISHED.name
                            val approvalStatus = try { ApprovalStatus.valueOf(approvalStatusStr) } catch (e: Exception) { ApprovalStatus.PUBLISHED }
                            val isPinned = doc.getBoolean("isPinned") ?: false

                            items.add(
                                AnnouncementItem(
                                    id = id,
                                    title = title,
                                    content = content,
                                    formattedDate = formattedDate,
                                    authorName = authorName,
                                    authorRole = authorRole,
                                    targetRegion = targetRegion,
                                    urgency = urgency,
                                    requirements = requirements,
                                    additionalInfo = additionalInfo,
                                    imageUrl = imageUrl,
                                    approvalStatus = approvalStatus,
                                    isPinned = isPinned
                                )
                            )
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to parse announcement doc ${doc.id}: ${e.localizedMessage}")
                        }
                    }
                    onUpdate(items)
                }
            }
    }

    /**
     * Menyimpan atau memperbarui Kegiatan di Cloud Firestore.
     */
    suspend fun saveActivity(activity: ActivityItem): Result<Unit> {
        return try {
            val data = hashMapOf(
                "title" to activity.title,
                "description" to activity.description,
                "category" to activity.category.name,
                "dateIso" to activity.dateIso,
                "formattedDate" to activity.formattedDate,
                "timeSlot" to activity.timeSlot,
                "locationName" to activity.locationName,
                "locationAddress" to activity.locationAddress,
                "latitude" to activity.latitude,
                "longitude" to activity.longitude,
                "targetRegion" to activity.targetRegion,
                "organizerRole" to activity.organizerRole.name,
                "organizerName" to activity.organizerName,
                "userId" to activity.userId,
                "creatorEmail" to activity.creatorEmail,
                "confirmedCount" to activity.confirmedCount,
                "maybeCount" to activity.maybeCount,
                "quota" to activity.quota,
                "approvalStatus" to activity.approvalStatus.name,
                "needsFollowUp" to activity.needsFollowUp,
                "followUpNote" to activity.followUpNote,
                "isFeatured" to activity.isFeatured,
                "imageUrl" to activity.imageUrl,
                "updatedAt" to System.currentTimeMillis()
            )
            firestore.collection(COLLECTION_ACTIVITIES).document(activity.id)
                .set(data, SetOptions.merge())
                .await()
            Log.d(TAG, "Activity ${activity.id} synced to Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save activity: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Menghapus Kegiatan dari Cloud Firestore.
     */
    suspend fun deleteActivity(activityId: String): Result<Unit> {
        return try {
            firestore.collection(COLLECTION_ACTIVITIES).document(activityId)
                .delete()
                .await()
            Log.d(TAG, "Activity $activityId deleted from Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete activity: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Memperbarui status RSVP / Partisipasi kehadiran pada Kegiatan di Cloud Firestore.
     */
    suspend fun updateRsvp(
        activityId: String,
        userId: String,
        userName: String,
        newStatus: RsvpStatus,
        diffConfirmed: Int,
        diffMaybe: Int
    ): Result<Unit> {
        return try {
            val docRef = firestore.collection(COLLECTION_ACTIVITIES).document(activityId)
            firestore.runTransaction { transaction ->
                val snapshot = transaction.get(docRef)
                val currentConfirmed = snapshot.getLong("confirmedCount") ?: 0
                val currentMaybe = snapshot.getLong("maybeCount") ?: 0

                @Suppress("UNCHECKED_CAST")
                val attendees = (snapshot.get("attendees") as? Map<String, String>)?.toMutableMap() ?: mutableMapOf()
                if (newStatus == RsvpStatus.NONE) {
                    attendees.remove(userId)
                } else {
                    attendees[userId] = newStatus.name
                }

                val newConfirmed = (currentConfirmed + diffConfirmed).coerceAtLeast(0)
                val newMaybe = (currentMaybe + diffMaybe).coerceAtLeast(0)

                transaction.update(
                    docRef,
                    mapOf(
                        "confirmedCount" to newConfirmed,
                        "maybeCount" to newMaybe,
                        "attendees" to attendees,
                        "updatedAt" to System.currentTimeMillis()
                    )
                )
            }.await()
            Log.d(TAG, "RSVP for activity $activityId by $userId synced to Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update RSVP: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Menyimpan atau memperbarui Pengumuman di Cloud Firestore.
     */
    suspend fun saveAnnouncement(announcement: AnnouncementItem): Result<Unit> {
        return try {
            val data = hashMapOf(
                "title" to announcement.title,
                "content" to announcement.content,
                "formattedDate" to announcement.formattedDate,
                "authorName" to announcement.authorName,
                "authorRole" to announcement.authorRole,
                "targetRegion" to announcement.targetRegion,
                "urgency" to announcement.urgency.name,
                "requirements" to announcement.requirements,
                "additionalInfo" to announcement.additionalInfo,
                "imageUrl" to announcement.imageUrl,
                "approvalStatus" to announcement.approvalStatus.name,
                "isPinned" to announcement.isPinned,
                "updatedAt" to System.currentTimeMillis()
            )
            firestore.collection(COLLECTION_ANNOUNCEMENTS).document(announcement.id)
                .set(data, SetOptions.merge())
                .await()
            Log.d(TAG, "Announcement ${announcement.id} synced to Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save announcement: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Menghapus Pengumuman dari Cloud Firestore.
     */
    suspend fun deleteAnnouncement(announcementId: String): Result<Unit> {
        return try {
            firestore.collection(COLLECTION_ANNOUNCEMENTS).document(announcementId)
                .delete()
                .await()
            Log.d(TAG, "Announcement $announcementId deleted from Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete announcement: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Mengisi data awal (seed) ke Firestore jika koleksi masih kosong agar semua HP langsung melihat data yang sama.
     */
    suspend fun seedInitialDataIfEmpty(
        defaultActivities: List<ActivityItem>,
        defaultAnnouncements: List<AnnouncementItem>
    ) {
        try {
            val actSnapshot = firestore.collection(COLLECTION_ACTIVITIES).limit(1).get().await()
            if (actSnapshot.isEmpty) {
                Log.d(TAG, "Seeding initial activities to Firestore...")
                for (act in defaultActivities) {
                    saveActivity(act)
                }
            }

            val annSnapshot = firestore.collection(COLLECTION_ANNOUNCEMENTS).limit(1).get().await()
            if (annSnapshot.isEmpty) {
                Log.d(TAG, "Seeding initial announcements to Firestore...")
                for (ann in defaultAnnouncements) {
                    saveAnnouncement(ann)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Seeding initial data skipped/failed: ${e.localizedMessage}")
        }
    }

    /**
     * Berlangganan (Real-time listener) daftar seluruh akun warga terdaftar untuk Admin.
     */
    fun listenToUsers(
        onUpdate: (List<UserProfile>) -> Unit,
        onError: ((Exception) -> Unit)? = null
    ): ListenerRegistration {
        return firestore.collection(COLLECTION_USERS)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Error listening to users: ${error.localizedMessage}", error)
                    onError?.invoke(error)
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val users = mutableListOf<UserProfile>()
                    for (doc in snapshot.documents) {
                        try {
                            val id = doc.id
                            val email = doc.getString("email") ?: continue
                            val name = doc.getString("displayName") ?: doc.getString("name") ?: email.substringBefore("@")
                            val photoUrl = doc.getString("photoUrl") ?: doc.getString("avatarUrl") ?: ""
                            val roleStr = doc.getString("userRole") ?: doc.getString("role") ?: UserRole.WARGA.name
                            val role = try {
                                UserRole.valueOf(roleStr)
                            } catch (e: Exception) {
                                if (roleStr.equals("admin", ignoreCase = true) || email.equals("salmanakhdanhidayat@gmail.com", ignoreCase = true)) {
                                    UserRole.STAF_KELURAHAN
                                } else {
                                    UserRole.WARGA
                                }
                            }
                            val rt = doc.getString("rt") ?: "03"
                            val rw = doc.getString("rw") ?: "05"
                            val kelurahan = doc.getString("kelurahan") ?: "Sukamaju"
                            val phone = doc.getString("phone") ?: "0812-3456-7890"
                            val nik = doc.getString("nik") ?: "3201019876540002"

                            users.add(
                                UserProfile(
                                    id = id,
                                    name = name,
                                    nik = nik,
                                    role = role,
                                    rt = rt,
                                    rw = rw,
                                    kelurahan = kelurahan,
                                    phone = phone,
                                    email = email,
                                    avatarUrl = photoUrl
                                )
                            )
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to parse user doc ${doc.id}: ${e.localizedMessage}")
                        }
                    }
                    onUpdate(users)
                }
            }
    }

    /**
     * Memperbarui Role / Hak Akses akun warga oleh Admin ke Cloud Firestore.
     */
    suspend fun updateUserRole(
        userId: String,
        newRole: UserRole,
        rt: String = "03",
        rw: String = "05",
        email: String? = null
    ): Result<Unit> {
        return try {
            val updates = hashMapOf<String, Any>(
                "role" to if (newRole == UserRole.STAF_KELURAHAN) "admin" else "member",
                "userRole" to newRole.name,
                "rt" to rt,
                "rw" to rw,
                "updatedAt" to System.currentTimeMillis()
            )
            // Update by document ID
            firestore.collection(COLLECTION_USERS).document(userId)
                .set(updates, SetOptions.merge())
                .await()

            // Also update by email query if email is provided (ensures 100% sync regardless of UID type)
            if (!email.isNullOrEmpty()) {
                val emailSnap = firestore.collection(COLLECTION_USERS)
                    .whereEqualTo("email", email)
                    .get()
                    .await()
                for (doc in emailSnap.documents) {
                    if (doc.id != userId) {
                        firestore.collection(COLLECTION_USERS).document(doc.id)
                            .set(updates, SetOptions.merge())
                    }
                }
            }

            Log.d(TAG, "User $userId role updated to ${newRole.name} in Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update user role: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Memperbarui foto profil akun pengguna ke Cloud Firestore.
     */
    suspend fun updateProfilePhoto(
        userId: String,
        email: String,
        photoBase64: String
    ): Result<Unit> {
        return try {
            val updates = hashMapOf<String, Any>(
                "photoUrl" to photoBase64,
                "avatarUrl" to photoBase64,
                "updatedAt" to System.currentTimeMillis()
            )
            firestore.collection(COLLECTION_USERS).document(userId)
                .set(updates, SetOptions.merge())
                .await()

            if (email.isNotBlank()) {
                val emailSnap = firestore.collection(COLLECTION_USERS)
                    .whereEqualTo("email", email)
                    .get()
                    .await()
                for (doc in emailSnap.documents) {
                    if (doc.id != userId) {
                        firestore.collection(COLLECTION_USERS).document(doc.id)
                            .set(updates, SetOptions.merge())
                    }
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update profile photo: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    /**
     * Menyimpan data profil user saat login atau register tanpa menimpa role yang sudah ada.
     */
    suspend fun saveUserProfile(profile: UserProfile): Result<Unit> {
        return try {
            val docRef = firestore.collection(COLLECTION_USERS).document(profile.id)
            val existingDoc = docRef.get().await()

            val existingRoleStr = if (existingDoc.exists()) {
                existingDoc.getString("userRole") ?: existingDoc.getString("role")
            } else null

            val targetRole = if (!existingRoleStr.isNullOrEmpty()) {
                try { UserRole.valueOf(existingRoleStr) } catch (e: Exception) { profile.role }
            } else {
                profile.role
            }

            val targetRt = if (existingDoc.exists()) existingDoc.getString("rt") ?: profile.rt else profile.rt
            val targetRw = if (existingDoc.exists()) existingDoc.getString("rw") ?: profile.rw else profile.rw

            val data = hashMapOf(
                "uid" to profile.id,
                "id" to profile.id,
                "email" to profile.email,
                "displayName" to profile.name,
                "name" to profile.name,
                "photoUrl" to (existingDoc.getString("photoUrl") ?: profile.avatarUrl),
                "avatarUrl" to (existingDoc.getString("avatarUrl") ?: profile.avatarUrl),
                "role" to if (targetRole == UserRole.STAF_KELURAHAN) "admin" else "member",
                "userRole" to targetRole.name,
                "rt" to targetRt,
                "rw" to targetRw,
                "kelurahan" to profile.kelurahan,
                "phone" to profile.phone,
                "nik" to profile.nik,
                "lastLoginAt" to System.currentTimeMillis()
            )
            docRef.set(data, SetOptions.merge()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save user profile: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    // --- APP & KELURAHAN IDENTITY CONFIGURATION ---
    private val COLLECTION_CONFIG = "settings"
    private val DOC_APP_CONFIG = "app_config"

    /**
     * Berlangganan konfigurasi identitas kelurahan & wilayah secara real-time.
     */
    fun listenToAppConfig(
        onUpdate: (appName: String, kelurahan: String, rw: String) -> Unit
    ): ListenerRegistration {
        return firestore.collection(COLLECTION_CONFIG).document(DOC_APP_CONFIG)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "App config listen error: ${error.localizedMessage}")
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    val appName = snapshot.getString("appName") ?: "Kegiatan Kelurahan"
                    val kelurahan = snapshot.getString("kelurahanName") ?: snapshot.getString("kelurahan") ?: "Sukamaju"
                    val rw = snapshot.getString("rwScope") ?: snapshot.getString("rw") ?: "RW 05"
                    onUpdate(appName, kelurahan, rw)
                }
            }
    }

    /**
     * Memperbarui identitas kelurahan dan wilayah oleh Admin.
     */
    suspend fun updateAppConfig(appName: String, kelurahan: String, rw: String): Result<Unit> {
        return try {
            val data = hashMapOf(
                "appName" to appName,
                "kelurahanName" to kelurahan,
                "rwScope" to rw,
                "updatedAt" to System.currentTimeMillis()
            )
            firestore.collection(COLLECTION_CONFIG).document(DOC_APP_CONFIG)
                .set(data, SetOptions.merge())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update app config: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }
}
