package com.agon.app.data.models

import androidx.compose.ui.graphics.Color
import com.agon.app.ui.theme.*
import kotlinx.serialization.Serializable

@Serializable
enum class UserRole(
    val title: String,
    val subtitle: String,
    val code: String,
    val description: String
) {
    WARGA(
        title = "Warga",
        subtitle = "Warga RT 03 / RW 05",
        code = "WARGA",
        description = "Lihat kegiatan resmi, lakukan konfirmasi RSVP, dan pantau pengumuman wilayah."
    ),
    RT(
        title = "Pengurus RT",
        subtitle = "Ketua RT 03 Sukamaju",
        code = "RT",
        description = "Ajukan kegiatan/pengumuman baru RT (Status awal: Menunggu ACC RW)."
    ),
    RW(
        title = "Pengurus RW",
        subtitle = "Ketua RW 05 Sukamaju",
        code = "RW",
        description = "Setujui (ACC) pengajuan kegiatan RT & terjemahkan usulan ke Staf Kelurahan."
    ),
    POSYANDU(
        title = "Kader Posyandu",
        subtitle = "Posyandu Melati 03",
        code = "POSYANDU",
        description = "Jadwalkan penimbangan balita, cek kesehatan lansia, dan terbitkan jadwal posyandu."
    ),
    STAF_KELURAHAN(
        title = "Staf Kelurahan",
        subtitle = "Seksi Kesejahteraan Kelurahan",
        code = "STAF_KELURAHAN",
        description = "Pemeriksaan akhir pengajuan yang disetujui RW dan publikasi resmi untuk warga."
    );

    val badgeColor: Color
        get() = when (this) {
            WARGA -> SkyBlueHeader
            RT -> YellowAccent
            RW -> KerjaBaktiOrange
            POSYANDU -> PosyanduPink
            STAF_KELURAHAN -> RapatBlue
        }
}

@Serializable
data class UserProfile(
    val id: String = "USR-001",
    val name: String = "Budi Santoso",
    val nik: String = "3271041208850003",
    val role: UserRole = UserRole.WARGA,
    val rt: String = "03",
    val rw: String = "05",
    val kelurahan: String = "Sukamaju",
    val phone: String = "0812-3456-7890",
    val email: String = "budi.santoso@warga.id",
    val avatarUrl: String = ""
)
