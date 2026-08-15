package com.salmon.app.viewmodel

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.ListenerRegistration
import com.salmon.app.data.LocalDataStore
import com.salmon.app.data.SampleData
import com.salmon.app.data.auth.AuthManager
import com.salmon.app.data.auth.AuthResult
import com.salmon.app.data.auth.EncryptedSessionManager
import com.salmon.app.data.models.*
import com.salmon.app.data.repository.FirestoreRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val localDataStore = LocalDataStore(application)
    val sessionManager = EncryptedSessionManager(application)
    val authManager = AuthManager(application, sessionManager)
    private val firestoreRepository = FirestoreRepository()

    private var activitiesListener: ListenerRegistration? = null
    private var announcementsListener: ListenerRegistration? = null

    // Current logged-in user profile & role
    var currentUser by mutableStateOf(
        authManager.checkAutoLogin() ?: localDataStore.loadUserProfile()
    )
        private set

    // Auth states
    var isLoggedIn by mutableStateOf(sessionManager.isLoggedIn())
        private set

    var isAuthLoading by mutableStateOf(false)
        private set

    var authErrorMessage by mutableStateOf<String?>(null)
        private set

    // Activity list state
    val activities = mutableStateListOf<ActivityItem>().apply {
        addAll(localDataStore.loadActivities())
    }

    // Announcement list state
    val announcements = mutableStateListOf<AnnouncementItem>().apply {
        addAll(localDataStore.loadAnnouncements())
    }

    // Contact list state
    val contacts = mutableStateListOf<ContactItem>().apply {
        addAll(localDataStore.loadContacts())
    }

    // Registered Citizens list state (Multi-Device Firestore)
    val allUsers = mutableStateListOf<UserProfile>()
    private var usersListener: ListenerRegistration? = null
    private var appConfigListener: ListenerRegistration? = null

    // App & Kelurahan Identity (Admin configurable)
    var appName by mutableStateOf("Konek")
    var kelurahanName by mutableStateOf("Sukamaju")
    var rwScope by mutableStateOf("RW 05")

    // Filter states
    var selectedCategoryFilter by mutableStateOf<ActivityCategory?>(null)
    var selectedRegionFilter by mutableStateOf("Semua Wilayah")
    var searchQuery by mutableStateOf("")
    var calendarSelectedDateIso by mutableStateOf("2025-05-18")

    // Accessibility state
    var textScaleFactor by mutableFloatStateOf(1.0f)
    var highContrastEnabled by mutableStateOf(false)

    // Notification banner state
    var snackbarMessage by mutableStateOf<String?>(null)

    init {
        // Auto-login check saat ViewModel diinisialisasi
        val activeProfile = authManager.checkAutoLogin()
        if (activeProfile != null) {
            currentUser = activeProfile
            isLoggedIn = true
        }

        // Mulai sinkronisasi Cloud Firestore real-time
        startRealtimeSync()
    }

    /**
     * Mengaktifkan sinkronisasi real-time Cloud Firestore antar perangkat.
     */
    fun startRealtimeSync() {
        viewModelScope.launch(Dispatchers.IO) {
            // 0. Pastikan autentikasi aktif
            firestoreRepository.ensureAuthenticated()

            // 1. Seed data awal jika Firestore masih kosong
            firestoreRepository.seedInitialDataIfEmpty(
                defaultActivities = SampleData.sampleActivities,
                defaultAnnouncements = SampleData.sampleAnnouncements
            )
        }

        // 2. Pasang Listener Konfigurasi Identitas Kelurahan
        appConfigListener?.remove()
        appConfigListener = firestoreRepository.listenToAppConfig { remoteApp, remoteKel, remoteRw ->
            viewModelScope.launch(Dispatchers.Main) {
                appName = remoteApp
                kelurahanName = remoteKel
                rwScope = remoteRw
            }
        }

        // 3. Pasang Listener Kegiatan Real-Time
        activitiesListener?.remove()
        activitiesListener = firestoreRepository.listenToActivities(
            currentUserId = currentUser.id,
            onUpdate = { firestoreActivities ->
                viewModelScope.launch(Dispatchers.Main) {
                    if (firestoreActivities.isNotEmpty()) {
                        val localMap = activities.associateBy { it.id }.toMutableMap()
                        firestoreActivities.forEach { remote ->
                            localMap[remote.id] = remote
                        }
                        activities.clear()
                        activities.addAll(localMap.values.sortedByDescending { it.id })
                        persistActivities()
                    }
                }
            },
            onError = { err ->
                Log.e("AppViewModel", "Firestore activity sync error: ${err.localizedMessage}")
                if (err.localizedMessage?.contains("PERMISSION_DENIED", ignoreCase = true) == true) {
                    viewModelScope.launch(Dispatchers.Main) {
                        showToast("Firestore: PERMISSION_DENIED. Periksa aturan Rules di Firebase Console.")
                    }
                }
            }
        )

        // 4. Pasang Listener Pengumuman Real-Time
        announcementsListener?.remove()
        announcementsListener = firestoreRepository.listenToAnnouncements(
            onUpdate = { firestoreAnnouncements ->
                viewModelScope.launch(Dispatchers.Main) {
                    if (firestoreAnnouncements.isNotEmpty()) {
                        val localMap = announcements.associateBy { it.id }.toMutableMap()
                        firestoreAnnouncements.forEach { remote ->
                            localMap[remote.id] = remote
                        }
                        announcements.clear()
                        announcements.addAll(localMap.values.sortedByDescending { it.id })
                        persistAnnouncements()
                    }
                }
            },
            onError = { err ->
                Log.e("AppViewModel", "Firestore announcement sync error: ${err.localizedMessage}")
            }
        )

        // 5. Pasang Listener Akun Warga & Roles Real-Time (untuk Admin & Pengguna)
        usersListener?.remove()
        usersListener = firestoreRepository.listenToUsers(
            onUpdate = { firestoreUsers ->
                viewModelScope.launch(Dispatchers.Main) {
                    allUsers.clear()
                    allUsers.addAll(firestoreUsers)

                    // Jika role akun saya sendiri diubah oleh Admin dari HP lain, perbarui seketika!
                    val me = firestoreUsers.find { it.id == currentUser.id || it.email.equals(currentUser.email, ignoreCase = true) }
                    if (me != null) {
                        var changed = false
                        var updated = currentUser

                        if (me.role != currentUser.role || me.rt != currentUser.rt || me.rw != currentUser.rw) {
                            updated = updated.copy(
                                role = me.role,
                                rt = me.rt,
                                rw = me.rw
                            )
                            changed = true
                            showToast("Hak akses Anda: ${me.role.title} (${me.role.subtitle})")
                        }

                        if (me.avatarUrl.isNotBlank() && me.avatarUrl != currentUser.avatarUrl) {
                            updated = updated.copy(avatarUrl = me.avatarUrl)
                            changed = true
                        }

                        if (changed) {
                            currentUser = updated
                            sessionManager.saveSession(currentUser, null)
                        }
                    }
                }
            },
            onError = { err ->
                Log.e("AppViewModel", "Firestore users sync error: ${err.localizedMessage}")
            }
        )
    }

    override fun onCleared() {
        super.onCleared()
        activitiesListener?.remove()
        announcementsListener?.remove()
        usersListener?.remove()
        appConfigListener?.remove()
    }

    /**
     * Mengubah & menetapkan Role / Hak Akses akun warga oleh Admin.
     */
    fun updateUserRole(
        userId: String,
        newRole: UserRole,
        rt: String = "03",
        rw: String = "05"
    ) {
        val userItem = allUsers.find { it.id == userId }
        val targetEmail = userItem?.email

        val index = allUsers.indexOfFirst { it.id == userId }
        if (index != -1) {
            val updated = allUsers[index].copy(role = newRole, rt = rt, rw = rw)
            allUsers[index] = updated
        }

        if (currentUser.id == userId || (targetEmail != null && currentUser.email.equals(targetEmail, ignoreCase = true))) {
            currentUser = currentUser.copy(role = newRole, rt = rt, rw = rw)
            sessionManager.saveSession(currentUser, null)
        }

        viewModelScope.launch(Dispatchers.IO) {
            val res = firestoreRepository.updateUserRole(userId, newRole, rt, rw, targetEmail)
            withContext(Dispatchers.Main) {
                if (res.isSuccess) {
                    showToast("Hak akses warga berhasil diubah menjadi: ${newRole.title} (${newRole.subtitle})")
                } else {
                    showToast("Gagal mengubah role: ${res.exceptionOrNull()?.localizedMessage}")
                }
            }
        }
    }

    /**
     * Memperbarui foto profil pengguna saat ini.
     */
    fun updateProfilePhoto(photoBase64: String) {
        currentUser = currentUser.copy(avatarUrl = photoBase64)
        sessionManager.saveSession(currentUser, null)

        val index = allUsers.indexOfFirst { it.id == currentUser.id || it.email.equals(currentUser.email, ignoreCase = true) }
        if (index != -1) {
            allUsers[index] = allUsers[index].copy(avatarUrl = photoBase64)
        }

        viewModelScope.launch(Dispatchers.IO) {
            val res = firestoreRepository.updateProfilePhoto(currentUser.id, currentUser.email, photoBase64)
            withContext(Dispatchers.Main) {
                if (res.isSuccess) {
                    showToast("Foto profil berhasil diperbarui!")
                } else {
                    showToast("Gagal menyimpan foto profil ke cloud.")
                }
            }
        }
    }

    /**
     * Memperbarui identitas nama aplikasi, kelurahan, dan wilayah RW.
     */
    fun updateAppConfig(newAppName: String, newKelurahan: String, newRw: String) {
        appName = newAppName
        kelurahanName = newKelurahan
        rwScope = newRw
        viewModelScope.launch(Dispatchers.IO) {
            val res = firestoreRepository.updateAppConfig(newAppName, newKelurahan, newRw)
            withContext(Dispatchers.Main) {
                if (res.isSuccess) {
                    showToast("Pengaturan identitas kelurahan berhasil disimpan!")
                } else {
                    showToast("Gagal menyimpan pengaturan: ${res.exceptionOrNull()?.localizedMessage}")
                }
            }
        }
    }

    // --- AUTENTIKASI GOOGLE & SESI ---

    fun signInWithGoogle(
        activityContext: Context,
        serverClientId: String,
        onSuccess: (UserProfile) -> Unit
    ) {
        viewModelScope.launch {
            isAuthLoading = true
            authErrorMessage = null
            when (val result = authManager.signInWithGoogle(activityContext, serverClientId)) {
                is AuthResult.Success -> {
                    currentUser = result.profile
                    isLoggedIn = true
                    isAuthLoading = false
                    persistProfile()
                    startRealtimeSync()
                    val roleLabel = if (result.profile.isAdmin) "Admin (Kelurahan)" else "Member (Warga)"
                    showToast("Login berhasil! Selamat datang, ${result.profile.name} [$roleLabel]")
                    onSuccess(result.profile)
                }
                is AuthResult.Error -> {
                    isAuthLoading = false
                    if (!result.isCancelled) {
                        authErrorMessage = result.message
                        showToast(result.message)
                    }
                }
            }
        }
    }

    fun handleGoogleAccountResult(
        account: com.google.android.gms.auth.api.signin.GoogleSignInAccount,
        onSuccess: (UserProfile) -> Unit
    ) {
        viewModelScope.launch {
            isAuthLoading = true
            authErrorMessage = null
            when (val result = authManager.handleGoogleSignInAccount(account)) {
                is AuthResult.Success -> {
                    currentUser = result.profile
                    isLoggedIn = true
                    isAuthLoading = false
                    persistProfile()
                    startRealtimeSync()
                    val roleLabel = if (result.profile.isAdmin) "Admin (Kelurahan)" else "Member (Warga)"
                    showToast("Login Google berhasil! Selamat datang, ${result.profile.name} [$roleLabel]")
                    onSuccess(result.profile)
                }
                is AuthResult.Error -> {
                    isAuthLoading = false
                    authErrorMessage = result.message
                    showToast(result.message)
                }
            }
        }
    }

    fun signInWithDirectGoogleEmail(
        email: String,
        name: String? = null,
        onSuccess: (UserProfile) -> Unit
    ) {
        val isAdmin = email.trim().equals(AuthManager.ADMIN_EMAIL, ignoreCase = true)
        val role = if (isAdmin) UserRole.STAF_KELURAHAN else UserRole.WARGA
        val userName = name ?: (if (isAdmin) "Salman Akhdan (Admin)" else email.substringBefore("@"))

        val profile = UserProfile(
            id = "USR-${Math.abs(email.hashCode())}",
            name = userName,
            nik = if (isAdmin) "3201012345670001" else "3201019876540002",
            role = role,
            rt = "002",
            rw = "005",
            kelurahan = "Sukamaju",
            phone = "081234567890",
            email = email.trim()
        )

        sessionManager.saveSession(profile)
        currentUser = profile
        isLoggedIn = true
        persistProfile()
        startRealtimeSync()

        val roleLabel = if (isAdmin) "Admin (Kelurahan)" else "Member (Warga)"
        showToast("Masuk sebagai: ${profile.name} [$roleLabel]")
        onSuccess(profile)
    }

    fun setAuthError(message: String) {
        authErrorMessage = message
        showToast(message)
    }

    fun signInWithDemo(role: UserRole, customEmail: String? = null, onSuccess: (UserProfile) -> Unit) {
        val profile = authManager.signInAsDemoRole(role, customEmail)
        currentUser = profile
        isLoggedIn = true
        persistProfile()
        startRealtimeSync()
        val roleLabel = if (profile.isAdmin) "Admin (Kelurahan)" else "Member (${profile.role.title})"
        showToast("Masuk mode demo: ${profile.name} [$roleLabel]")
        onSuccess(profile)
    }

    fun signOut(onComplete: () -> Unit) {
        viewModelScope.launch {
            isAuthLoading = true
            authManager.signOut()
            isLoggedIn = false
            currentUser = SampleData.defaultUserProfile
            persistProfile()
            isAuthLoading = false
            showToast("Anda telah keluar dari akun.")
            onComplete()
        }
    }

    fun clearAuthError() {
        authErrorMessage = null
    }

    private fun persistActivities() {
        viewModelScope.launch(Dispatchers.IO) {
            localDataStore.saveActivities(activities.toList())
        }
    }

    private fun persistAnnouncements() {
        viewModelScope.launch(Dispatchers.IO) {
            localDataStore.saveAnnouncements(announcements.toList())
        }
    }

    private fun persistProfile() {
        viewModelScope.launch(Dispatchers.IO) {
            localDataStore.saveUserProfile(currentUser)
        }
    }

    private fun persistContacts() {
        viewModelScope.launch(Dispatchers.IO) {
            localDataStore.saveContacts(contacts.toList())
        }
    }

    fun switchRole(newRole: UserRole) {
        val newTitle = when (newRole) {
            UserRole.WARGA -> "Budi Santoso"
            UserRole.RT -> "Bambang Wijaya (Ketua RT 03)"
            UserRole.RW -> "Sutrisno (Ketua RW 05)"
            UserRole.POSYANDU -> "Ibu Ningsih (Kader Posyandu)"
            UserRole.STAF_KELURAHAN -> "Salman Akhdan Hidayat (Admin)"
        }
        val newEmail = if (newRole == UserRole.STAF_KELURAHAN) "salmanakhdanhidayat@gmail.com" else "${newRole.code.lowercase()}@sukamaju.id"
        currentUser = currentUser.copy(
            role = newRole,
            name = newTitle,
            email = newEmail
        )
        sessionManager.saveSession(currentUser)
        persistProfile()
        startRealtimeSync()
        showToast("Beralih ke peran: ${newRole.title} (${currentUser.roleType})")
    }

    // --- HAK AKSES ROLE-BASED ACCESS CONTROL (RBAC) ---

    fun canUserEditActivity(activity: ActivityItem): Boolean {
        if (currentUser.isAdmin) return true
        if (activity.userId.isNotBlank() && activity.userId == currentUser.id) return true
        if (activity.creatorEmail.isNotBlank() && activity.creatorEmail.equals(currentUser.email, ignoreCase = true)) return true
        if (activity.organizerName.equals(currentUser.name, ignoreCase = true)) return true
        return activity.organizerRole == currentUser.role
    }

    fun canUserDeleteActivity(activity: ActivityItem): Boolean {
        return canUserEditActivity(activity)
    }

    fun canUserApprove(): Boolean {
        return currentUser.isAdmin || currentUser.role == UserRole.RW
    }

    fun updateRsvpStatus(activityId: String, newStatus: RsvpStatus) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            val oldItem = activities[index]
            val oldStatus = oldItem.userRsvpStatus
            
            var diffConfirmed = 0
            var diffMaybe = 0

            if (oldStatus == RsvpStatus.ATTENDING) diffConfirmed--
            if (oldStatus == RsvpStatus.MAYBE) diffMaybe--

            if (newStatus == RsvpStatus.ATTENDING) diffConfirmed++
            if (newStatus == RsvpStatus.MAYBE) diffMaybe++

            val updated = oldItem.copy(
                userRsvpStatus = newStatus,
                confirmedCount = (oldItem.confirmedCount + diffConfirmed).coerceAtLeast(0),
                maybeCount = (oldItem.maybeCount + diffMaybe).coerceAtLeast(0)
            )
            activities[index] = updated
            persistActivities()

            // Sinkronisasi RSVP ke Cloud Firestore
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.updateRsvp(
                    activityId = activityId,
                    userId = currentUser.id,
                    userName = currentUser.name,
                    newStatus = newStatus,
                    diffConfirmed = diffConfirmed,
                    diffMaybe = diffMaybe
                )
            }
            
            val msg = when(newStatus) {
                RsvpStatus.ATTENDING -> "Status RSVP disetujui: Anda memilih HADIR!"
                RsvpStatus.MAYBE -> "Status RSVP: Ragu-ragu dicatat."
                RsvpStatus.NOT_ATTENDING -> "Status RSVP: Anda memilih Tidak Hadir."
                RsvpStatus.NONE -> "Status RSVP dihapus."
            }
            showToast(msg)
        }
    }

    // --- KEGIATAN CRUD & MULTI-TIER APPROVAL ---
    fun addActivity(
        title: String,
        description: String,
        category: ActivityCategory,
        dateIso: String,
        formattedDate: String,
        timeSlot: String,
        locationName: String,
        locationAddress: String,
        targetRegion: String,
        quota: Int?,
        imageUrl: String? = null
    ) {
        val initialApproval = when {
            currentUser.isAdmin -> ApprovalStatus.PUBLISHED
            currentUser.role == UserRole.RT -> ApprovalStatus.WAITING_RW_APPROVAL
            currentUser.role == UserRole.RW -> ApprovalStatus.WAITING_ADMIN_APPROVAL
            else -> ApprovalStatus.PUBLISHED
        }

        val newId = "ACT-${System.currentTimeMillis()}"
        val newItem = ActivityItem(
            id = newId,
            title = title,
            description = description,
            category = category,
            dateIso = dateIso,
            formattedDate = formattedDate,
            timeSlot = timeSlot,
            locationName = locationName,
            locationAddress = locationAddress,
            targetRegion = targetRegion,
            organizerRole = currentUser.role,
            organizerName = currentUser.name,
            userId = currentUser.id,
            creatorEmail = currentUser.email,
            confirmedCount = 1,
            quota = quota,
            userRsvpStatus = RsvpStatus.ATTENDING,
            approvalStatus = initialApproval,
            needsFollowUp = initialApproval != ApprovalStatus.PUBLISHED,
            followUpNote = if (initialApproval == ApprovalStatus.WAITING_RW_APPROVAL) "Menunggu ACC Ketua RW 05" else if (initialApproval == ApprovalStatus.WAITING_ADMIN_APPROVAL) "Menunggu ACC Staf Kelurahan" else null,
            isFeatured = false,
            imageUrl = imageUrl
        )
        activities.add(0, newItem)
        persistActivities()

        // Sinkronisasi ke Cloud Firestore
        viewModelScope.launch(Dispatchers.IO) {
            firestoreRepository.saveActivity(newItem)
        }

        val toastMsg = when (initialApproval) {
            ApprovalStatus.WAITING_RW_APPROVAL -> "Pengajuan kegiatan dikirim. Menunggu persetujuan RW!"
            ApprovalStatus.WAITING_ADMIN_APPROVAL -> "Pengajuan kegiatan dikirim. Menunggu persetujuan Kelurahan!"
            else -> "Kegiatan berhasil diterbitkan ke seluruh perangkat!"
        }
        showToast(toastMsg)
    }

    fun updateActivity(
        id: String,
        title: String,
        description: String,
        category: ActivityCategory,
        dateIso: String,
        formattedDate: String,
        timeSlot: String,
        locationName: String,
        locationAddress: String,
        targetRegion: String,
        quota: Int?,
        imageUrl: String? = null
    ): Boolean {
        val index = activities.indexOfFirst { it.id == id }
        if (index != -1) {
            val existing = activities[index]
            if (!canUserEditActivity(existing)) {
                showToast("Akses ditolak: Hanya pemilik kegiatan atau Admin yang dapat mengedit.")
                return false
            }
            val updatedItem = existing.copy(
                title = title,
                description = description,
                category = category,
                dateIso = dateIso,
                formattedDate = formattedDate,
                timeSlot = timeSlot,
                locationName = locationName,
                locationAddress = locationAddress,
                targetRegion = targetRegion,
                quota = quota,
                imageUrl = imageUrl ?: existing.imageUrl
            )
            activities[index] = updatedItem
            persistActivities()

            // Sinkronisasi perubahan ke Cloud Firestore
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveActivity(updatedItem)
            }

            showToast("Perubahan kegiatan '${title}' berhasil diperbarui ke seluruh perangkat!")
            return true
        }
        return false
    }

    fun deleteActivity(id: String): Boolean {
        val index = activities.indexOfFirst { it.id == id }
        if (index != -1) {
            val existing = activities[index]
            if (!canUserDeleteActivity(existing)) {
                showToast("Akses ditolak: Hanya pemilik kegiatan atau Admin yang dapat menghapus.")
                return false
            }
            activities.removeAt(index)
            persistActivities()

            // Sinkronisasi penghapusan ke Cloud Firestore
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.deleteActivity(id)
            }

            showToast("Kegiatan '${existing.title}' berhasil dihapus.")
            return true
        }
        return false
    }

    // RW Approval Actions
    fun rwApproveActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            val updated = activities[index].copy(
                approvalStatus = ApprovalStatus.WAITING_ADMIN_APPROVAL,
                needsFollowUp = true,
                followUpNote = "Telah disetujui RW 05 • Menunggu ACC Kelurahan"
            )
            activities[index] = updated
            persistActivities()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveActivity(updated)
            }
            showToast("Kegiatan disetujui RW & diteruskan ke Staf Kelurahan!")
        }
    }

    fun rwRejectActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            val updated = activities[index].copy(
                approvalStatus = ApprovalStatus.REJECTED,
                needsFollowUp = false,
                followUpNote = "Ditolak oleh Ketua RW 05"
            )
            activities[index] = updated
            persistActivities()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveActivity(updated)
            }
            showToast("Pengajuan kegiatan telah ditolak oleh RW.")
        }
    }

    // Kelurahan Admin Approval Actions
    fun adminApproveActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            val updated = activities[index].copy(
                approvalStatus = ApprovalStatus.PUBLISHED,
                needsFollowUp = false,
                followUpNote = null
            )
            activities[index] = updated
            persistActivities()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveActivity(updated)
            }
            showToast("Kegiatan disetujui resmi & diterbitkan untuk Warga!")
        }
    }

    fun adminRejectActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            val updated = activities[index].copy(
                approvalStatus = ApprovalStatus.REJECTED,
                needsFollowUp = false,
                followUpNote = "Ditolak oleh Staf Kelurahan"
            )
            activities[index] = updated
            persistActivities()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveActivity(updated)
            }
            showToast("Pengajuan kegiatan ditolak oleh Staf Kelurahan.")
        }
    }

    // --- PENGUMUMAN CRUD & MULTI-TIER APPROVAL ---
    fun addAnnouncement(
        title: String,
        content: String,
        urgency: AnnouncementUrgency,
        targetRegion: String,
        requirements: List<String> = emptyList(),
        additionalInfo: String? = null,
        imageUrl: String? = null
    ) {
        val initialApproval = when {
            currentUser.isAdmin -> ApprovalStatus.PUBLISHED
            currentUser.role == UserRole.RT -> ApprovalStatus.WAITING_RW_APPROVAL
            currentUser.role == UserRole.RW -> ApprovalStatus.WAITING_ADMIN_APPROVAL
            else -> ApprovalStatus.PUBLISHED
        }

        val newAnn = AnnouncementItem(
            id = "ANN-${System.currentTimeMillis()}",
            title = title,
            content = content,
            formattedDate = "Hari Ini",
            authorName = currentUser.name,
            authorRole = currentUser.role.title,
            targetRegion = targetRegion,
            urgency = urgency,
            requirements = requirements,
            additionalInfo = additionalInfo,
            approvalStatus = initialApproval,
            isPinned = urgency == AnnouncementUrgency.PENTING || urgency == AnnouncementUrgency.DARURAT,
            imageUrl = imageUrl
        )
        announcements.add(0, newAnn)
        persistAnnouncements()

        // Sinkronisasi ke Cloud Firestore
        viewModelScope.launch(Dispatchers.IO) {
            firestoreRepository.saveAnnouncement(newAnn)
        }

        val toastMsg = when (initialApproval) {
            ApprovalStatus.WAITING_RW_APPROVAL -> "Pengumuman dikirim. Menunggu persetujuan RW!"
            ApprovalStatus.WAITING_ADMIN_APPROVAL -> "Pengumuman dikirim. Menunggu persetujuan Kelurahan!"
            else -> "Pengumuman resmi berhasil diterbitkan ke seluruh perangkat!"
        }
        showToast(toastMsg)
    }

    fun updateAnnouncement(
        id: String,
        title: String,
        content: String,
        urgency: AnnouncementUrgency,
        targetRegion: String,
        requirements: List<String> = emptyList(),
        additionalInfo: String? = null,
        imageUrl: String? = null
    ) {
        val index = announcements.indexOfFirst { it.id == id }
        if (index != -1) {
            val existing = announcements[index]
            val updated = existing.copy(
                title = title,
                content = content,
                urgency = urgency,
                targetRegion = targetRegion,
                requirements = requirements,
                additionalInfo = additionalInfo,
                isPinned = urgency == AnnouncementUrgency.PENTING || urgency == AnnouncementUrgency.DARURAT,
                imageUrl = imageUrl ?: existing.imageUrl
            )
            announcements[index] = updated
            persistAnnouncements()

            // Sinkronisasi ke Cloud Firestore
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveAnnouncement(updated)
            }

            showToast("Pengumuman diperbarui ke seluruh perangkat!")
        }
    }

    fun rwApproveAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            val updated = announcements[index].copy(
                approvalStatus = ApprovalStatus.WAITING_ADMIN_APPROVAL
            )
            announcements[index] = updated
            persistAnnouncements()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveAnnouncement(updated)
            }
            showToast("Pengumuman disetujui RW & diteruskan ke Staf Kelurahan!")
        }
    }

    fun adminApproveAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            val updated = announcements[index].copy(
                approvalStatus = ApprovalStatus.PUBLISHED
            )
            announcements[index] = updated
            persistAnnouncements()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveAnnouncement(updated)
            }
            showToast("Pengumuman disetujui resmi & diterbitkan untuk Warga!")
        }
    }

    fun rejectAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            val updated = announcements[index].copy(
                approvalStatus = ApprovalStatus.REJECTED
            )
            announcements[index] = updated
            persistAnnouncements()
            viewModelScope.launch(Dispatchers.IO) {
                firestoreRepository.saveAnnouncement(updated)
            }
            showToast("Pengumuman ditolak.")
        }
    }

    // --- KONTAK PENTING CRUD ---
    fun addContact(
        nameTitle: String,
        phoneNumber: String,
        category: String
    ) {
        val newContact = ContactItem(
            id = "CNT-${System.currentTimeMillis() % 1000}",
            nameTitle = nameTitle,
            phoneNumber = phoneNumber,
            category = category
        )
        contacts.add(newContact)
        persistContacts()
        showToast("Kontak penting berhasil ditambahkan!")
    }

    fun updateContact(
        id: String,
        nameTitle: String,
        phoneNumber: String,
        category: String
    ) {
        val index = contacts.indexOfFirst { it.id == id }
        if (index != -1) {
            val existing = contacts[index]
            contacts[index] = existing.copy(
                nameTitle = nameTitle,
                phoneNumber = phoneNumber,
                category = category
            )
            persistContacts()
            showToast("Kontak penting berhasil diperbarui!")
        }
    }

    fun deleteContact(contactId: String) {
        val index = contacts.indexOfFirst { it.id == contactId }
        if (index != -1) {
            val removed = contacts.removeAt(index)
            persistContacts()
            showToast("Kontak '${removed.nameTitle}' telah dihapus.")
        }
    }

    fun showToast(msg: String) {
        snackbarMessage = msg
    }

    fun clearToast() {
        snackbarMessage = null
    }
}
