package com.agon.app.data.models

import androidx.compose.ui.graphics.Color
import com.agon.app.ui.theme.*
import kotlinx.serialization.Serializable

@Serializable
enum class ApprovalStatus(
    val label: String,
    val description: String
) {
    WAITING_RW_APPROVAL(
        label = "Menunggu Persetujuan RW",
        description = "Pengajuan dibuat oleh RT dan sedang menantikan persetujuan Ketua RW."
    ),
    WAITING_ADMIN_APPROVAL(
        label = "Menunggu Persetujuan Kelurahan",
        description = "Pengajuan telah disetujui RW dan menantikan persetujuan Staf Kelurahan."
    ),
    PUBLISHED(
        label = "Disetujui & Diterbitkan",
        description = "Telah disetujui resmi dan dipublikasikan untuk seluruh warga."
    ),
    REJECTED(
        label = "Ditolak",
        description = "Pengajuan belum dapat disetujui oleh pengurus RW/Kelurahan."
    );

    val badgeColor: Color
        get() = when (this) {
            WAITING_RW_APPROVAL -> YellowAccent
            WAITING_ADMIN_APPROVAL -> SkyBlueHeader
            PUBLISHED -> KesehatanGreen
            REJECTED -> UrgentRed
        }

    val containerColor: Color
        get() = when (this) {
            WAITING_RW_APPROVAL -> YellowContainer
            WAITING_ADMIN_APPROVAL -> SkyBlueSurfaceVariant
            PUBLISHED -> KesehatanGreenContainer
            REJECTED -> UrgentRedContainer
        }
}
