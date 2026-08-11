package com.agon.app.data.models

import androidx.compose.ui.graphics.Color
import com.agon.app.ui.theme.*
import kotlinx.serialization.Serializable

@Serializable
enum class AnnouncementUrgency(val label: String) {
    PENTING("PENTING"),
    INFO("INFORMASI"),
    IMBAUAN("IMBAUAN"),
    DARURAT("DARURAT");

    val badgeColor: Color
        get() = when (this) {
            PENTING -> UrgentRed
            INFO -> RapatBlue
            IMBAUAN -> YellowAccent
            DARURAT -> UrgentRed
        }

    val containerColor: Color
        get() = when (this) {
            PENTING -> UrgentRedContainer
            INFO -> RapatBlueContainer
            IMBAUAN -> YellowContainer
            DARURAT -> UrgentRedContainer
        }
}

@Serializable
data class AnnouncementItem(
    val id: String,
    val title: String,
    val content: String,
    val formattedDate: String,
    val authorName: String,
    val authorRole: String,
    val targetRegion: String,
    val urgency: AnnouncementUrgency,
    val requirements: List<String> = emptyList(), // e.g. ["Membawa KTP Asli", "Membawa Fotokopi KK", "Datang Tepat Waktu"]
    val additionalInfo: String? = null,
    val imageUrl: String? = null,
    val approvalStatus: ApprovalStatus = ApprovalStatus.PUBLISHED,
    val isPinned: Boolean = false
)
