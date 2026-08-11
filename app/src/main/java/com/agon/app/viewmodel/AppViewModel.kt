package com.agon.app.viewmodel

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.agon.app.data.LocalDataStore
import com.agon.app.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val localDataStore = LocalDataStore(application)

    // Current logged-in user profile & role
    var currentUser by mutableStateOf(localDataStore.loadUserProfile())
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
            UserRole.STAF_KELURAHAN -> "Hendra Pratama (Staf Kesra)"
        }
        currentUser = currentUser.copy(
            role = newRole,
            name = newTitle
        )
        persistProfile()
        showToast("Beralih ke peran: ${newRole.title}")
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
        quota: Int?
    ) {
        val initialApproval = when (currentUser.role) {
            UserRole.RT -> ApprovalStatus.WAITING_RW_APPROVAL
            UserRole.RW -> ApprovalStatus.WAITING_ADMIN_APPROVAL
            else -> ApprovalStatus.PUBLISHED
        }

        val newId = "ACT-${System.currentTimeMillis() % 10000}"
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
            confirmedCount = 1,
            quota = quota,
            userRsvpStatus = RsvpStatus.ATTENDING,
            approvalStatus = initialApproval,
            needsFollowUp = initialApproval != ApprovalStatus.PUBLISHED,
            followUpNote = if (initialApproval == ApprovalStatus.WAITING_RW_APPROVAL) "Menunggu ACC Ketua RW 05" else if (initialApproval == ApprovalStatus.WAITING_ADMIN_APPROVAL) "Menunggu ACC Staf Kelurahan" else null,
            isFeatured = false
        )
        activities.add(0, newItem)
        persistActivities()

        val toastMsg = when (initialApproval) {
            ApprovalStatus.WAITING_RW_APPROVAL -> "Pengajuan kegiatan dikirim. Menunggu persetujuan RW!"
            ApprovalStatus.WAITING_ADMIN_APPROVAL -> "Pengajuan kegiatan dikirim. Menunggu persetujuan Kelurahan!"
            else -> "Kegiatan resmi berhasil diterbitkan!"
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
        quota: Int?
    ) {
        val index = activities.indexOfFirst { it.id == id }
        if (index != -1) {
            val existing = activities[index]
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
                quota = quota
            )
            activities[index] = updatedItem
            persistActivities()
            showToast("Perubahan kegiatan '${title}' berhasil diperbarui!")
        }
    }

    // RW Approval Actions
    fun rwApproveActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            activities[index] = activities[index].copy(
                approvalStatus = ApprovalStatus.WAITING_ADMIN_APPROVAL,
                needsFollowUp = true,
                followUpNote = "Telah disetujui RW 05 • Menunggu ACC Kelurahan"
            )
            persistActivities()
            showToast("Kegiatan disetujui RW & diteruskan ke Staf Kelurahan!")
        }
    }

    fun rwRejectActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            activities[index] = activities[index].copy(
                approvalStatus = ApprovalStatus.REJECTED,
                needsFollowUp = false,
                followUpNote = "Ditolak oleh Ketua RW 05"
            )
            persistActivities()
            showToast("Pengajuan kegiatan telah ditolak oleh RW.")
        }
    }

    // Kelurahan Admin Approval Actions
    fun adminApproveActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            activities[index] = activities[index].copy(
                approvalStatus = ApprovalStatus.PUBLISHED,
                needsFollowUp = false,
                followUpNote = null
            )
            persistActivities()
            showToast("Kegiatan disetujui resmi & diterbitkan untuk Warga!")
        }
    }

    fun adminRejectActivity(activityId: String) {
        val index = activities.indexOfFirst { it.id == activityId }
        if (index != -1) {
            activities[index] = activities[index].copy(
                approvalStatus = ApprovalStatus.REJECTED,
                needsFollowUp = false,
                followUpNote = "Ditolak oleh Staf Kelurahan"
            )
            persistActivities()
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
        additionalInfo: String? = null
    ) {
        val initialApproval = when (currentUser.role) {
            UserRole.RT -> ApprovalStatus.WAITING_RW_APPROVAL
            UserRole.RW -> ApprovalStatus.WAITING_ADMIN_APPROVAL
            else -> ApprovalStatus.PUBLISHED
        }

        val newAnn = AnnouncementItem(
            id = "ANN-${System.currentTimeMillis() % 1000}",
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
            isPinned = urgency == AnnouncementUrgency.PENTING || urgency == AnnouncementUrgency.DARURAT
        )
        announcements.add(0, newAnn)
        persistAnnouncements()

        val toastMsg = when (initialApproval) {
            ApprovalStatus.WAITING_RW_APPROVAL -> "Pengumuman dikirim. Menunggu persetujuan RW!"
            ApprovalStatus.WAITING_ADMIN_APPROVAL -> "Pengumuman dikirim. Menunggu persetujuan Kelurahan!"
            else -> "Pengumuman resmi berhasil diterbitkan!"
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
        additionalInfo: String? = null
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
                isPinned = urgency == AnnouncementUrgency.PENTING || urgency == AnnouncementUrgency.DARURAT
            )
            announcements[index] = updated
            persistAnnouncements()
            showToast("Pengumuman diperbarui!")
        }
    }

    fun rwApproveAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            announcements[index] = announcements[index].copy(
                approvalStatus = ApprovalStatus.WAITING_ADMIN_APPROVAL
            )
            persistAnnouncements()
            showToast("Pengumuman disetujui RW & diteruskan ke Staf Kelurahan!")
        }
    }

    fun adminApproveAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            announcements[index] = announcements[index].copy(
                approvalStatus = ApprovalStatus.PUBLISHED
            )
            persistAnnouncements()
            showToast("Pengumuman disetujui resmi & diterbitkan untuk Warga!")
        }
    }

    fun rejectAnnouncement(announcementId: String) {
        val index = announcements.indexOfFirst { it.id == announcementId }
        if (index != -1) {
            announcements[index] = announcements[index].copy(
                approvalStatus = ApprovalStatus.REJECTED
            )
            persistAnnouncements()
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
