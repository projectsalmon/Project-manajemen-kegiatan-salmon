package com.salmon.app.data.models

import androidx.compose.ui.graphics.Color
import com.salmon.app.ui.theme.*
import kotlinx.serialization.Serializable

@Serializable
enum class ActivityCategory(
    val displayName: String,
    val iconName: String
) {
    POSYANDU("Posyandu & Ibu Anak", "favorite"),
    KERJA_BAKTI("Kerja Bakti & Kebersihan", "cleaning_services"),
    RAPAT("Rapat Warga & Musyawarah", "groups"),
    KESEHATAN("Cek Kesehatan & Lansia", "medical_services"),
    SOSIAL("Bantuan Sosial & Keagamaan", "volunteer_activism"),
    OLAH_RAGA("Olahraga & Pemuda", "sports_soccer");

    val badgeColor: Color
        get() = when (this) {
            POSYANDU -> PosyanduPink
            KERJA_BAKTI -> KerjaBaktiOrange
            RAPAT -> RapatBlue
            KESEHATAN -> KesehatanGreen
            SOSIAL -> RapatBlue
            OLAH_RAGA -> YellowAccent
        }

    val containerColor: Color
        get() = when (this) {
            POSYANDU -> PosyanduPinkContainer
            KERJA_BAKTI -> KerjaBaktiOrangeContainer
            RAPAT -> RapatBlueContainer
            KESEHATAN -> KesehatanGreenContainer
            SOSIAL -> SkyBlueSurfaceVariant
            OLAH_RAGA -> YellowContainer
        }
}

@Serializable
enum class RsvpStatus(val label: String) {
    ATTENDING("Hadir"),
    NOT_ATTENDING("Tidak Hadir"),
    MAYBE("Ragu-ragu"),
    NONE("Belum Respon");

    val color: Color
        get() = when (this) {
            ATTENDING -> SkyBlueHeader
            NOT_ATTENDING -> UrgentRed
            MAYBE -> YellowAccent
            NONE -> TextNavyMuted
        }
}

@Serializable
data class ActivityItem(
    val id: String,
    val title: String,
    val description: String,
    val category: ActivityCategory,
    val dateIso: String, // Format: YYYY-MM-DD
    val formattedDate: String, // e.g. "Minggu, 18 Mei 2025"
    val timeSlot: String, // e.g. "08:00 - 11:00 WIB"
    val locationName: String,
    val locationAddress: String,
    val latitude: Double = -6.200000,
    val longitude: Double = 106.816666,
    val targetRegion: String, // e.g. "RT 03 / RW 05"
    val organizerRole: UserRole,
    val organizerName: String,
    val userId: String = "",
    val creatorEmail: String = "",
    val confirmedCount: Int = 0,
    val maybeCount: Int = 0,
    val quota: Int? = null,
    val userRsvpStatus: RsvpStatus = RsvpStatus.NONE,
    val photos: List<String> = emptyList(),
    val imageUrl: String? = null,
    val approvalStatus: ApprovalStatus = ApprovalStatus.PUBLISHED,
    val needsFollowUp: Boolean = false,
    val followUpNote: String? = null,
    val isFeatured: Boolean = false
)
