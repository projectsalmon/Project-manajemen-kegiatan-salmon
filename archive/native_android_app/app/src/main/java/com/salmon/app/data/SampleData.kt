package com.salmon.app.data

import com.salmon.app.data.models.*

object SampleData {

    val defaultUserProfile = UserProfile(
        id = "USR-001",
        name = "Budi Santoso",
        nik = "3271041208850003",
        role = UserRole.WARGA,
        rt = "03",
        rw = "05",
        kelurahan = "Sukamaju",
        phone = "0812-3456-7890",
        email = "budi.santoso@warga.id"
    )

    val defaultContacts = listOf(
        ContactItem(
            id = "CNT-001",
            nameTitle = "Layanan Umum Kelurahan Sukamaju",
            phoneNumber = "(021) 8765-4321",
            category = "Kantor Kelurahan Sukamaju"
        ),
        ContactItem(
            id = "CNT-002",
            nameTitle = "Layanan Darurat Kesra & Bencana",
            phoneNumber = "0811-2233-4455",
            category = "Kantor Kelurahan Sukamaju"
        ),
        ContactItem(
            id = "CNT-003",
            nameTitle = "Bpk. Bambang Wijaya (Ketua RT 03)",
            phoneNumber = "0812-3456-7890",
            category = "Pengurus RT / RW"
        ),
        ContactItem(
            id = "CNT-004",
            nameTitle = "Bpk. Sutrisno (Ketua RW 05)",
            phoneNumber = "0813-9876-5432",
            category = "Pengurus RT / RW"
        ),
        ContactItem(
            id = "CNT-005",
            nameTitle = "Ibu Ningsih (Kader Utama Posyandu)",
            phoneNumber = "0815-6789-0123",
            category = "Kader Posyandu"
        ),
        ContactItem(
            id = "CNT-006",
            nameTitle = "Ibu Dewi (Kader Kesehatan Lansia)",
            phoneNumber = "0817-4567-8901",
            category = "Kader Posyandu"
        )
    )

    val sampleActivities = listOf(
        ActivityItem(
            id = "ACT-101",
            title = "Posyandu Balita & Imunisasi Rutin Mei",
            description = "Pemeriksaan tumbuh kembang balita, penimbangan berat badan, pengukuran tinggi badan, pemberian vitamin A, serta penyuluhan gizi bagi ibu dan balita wilayah RW 05 Sukamaju.",
            category = ActivityCategory.POSYANDU,
            dateIso = "2025-05-18",
            formattedDate = "Minggu, 18 Mei 2025",
            timeSlot = "08:00 - 11:30 WIB",
            locationName = "Posyandu Melati 03",
            locationAddress = "Balai Warga RT 03 / RW 05, Jl. Mawar No. 12",
            latitude = -6.2154,
            longitude = 106.8451,
            targetRegion = "RT 01 - RT 05 / RW 05",
            organizerRole = UserRole.POSYANDU,
            organizerName = "Ibu Ningsih (Kader Utama Posyandu)",
            confirmedCount = 42,
            maybeCount = 5,
            quota = 60,
            userRsvpStatus = RsvpStatus.ATTENDING,
            photos = listOf("posyandu_1", "posyandu_2"),
            imageUrl = "https://images.pexels.com/photos/8460159/pexels-photo-8460159.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.PUBLISHED,
            isFeatured = true
        ),
        ActivityItem(
            id = "ACT-102",
            title = "Kerja Bakti Masal & Pembersihan Selokan Menghadapi Musim Hujan",
            description = "Diharapkan setiap KK mengirimkan minimal 1 perwakilan warga untuk membersihkan saluran air, memotong ranting pohon yang menutupi penerangan jalan, dan pengangkatan sampah warga.",
            category = ActivityCategory.KERJA_BAKTI,
            dateIso = "2025-05-20",
            formattedDate = "Selasa, 20 Mei 2025",
            timeSlot = "06:30 - 09:30 WIB",
            locationName = "Area Lingkungan RT 03 & RT 04",
            locationAddress = "Kumpul di Lapangan Bulutangkis RT 03",
            latitude = -6.2160,
            longitude = 106.8460,
            targetRegion = "RT 03 & RT 04 / RW 05",
            organizerRole = UserRole.RT,
            organizerName = "Pak Bambang (Ketua RT 03)",
            confirmedCount = 28,
            maybeCount = 8,
            quota = 50,
            userRsvpStatus = RsvpStatus.NONE,
            photos = listOf("kerjabakti_1"),
            imageUrl = "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.WAITING_RW_APPROVAL,
            needsFollowUp = true,
            followUpNote = "Memerlukan ACC dari Ketua RW 05",
            isFeatured = true
        ),
        ActivityItem(
            id = "ACT-103",
            title = "Rapat Musyawarah Pemilihan Ketua RW 05 Periode 2025-2028",
            description = "Musyawarah warga tahunan untuk evaluasi program kerja RW 05 serta pembahasan bakal calon Ketua RW baru. Dilanjutkan dengan pembagian bantuan stimulan lingkungan.",
            category = ActivityCategory.RAPAT,
            dateIso = "2025-05-24",
            formattedDate = "Sabtu, 24 Mei 2025",
            timeSlot = "19:30 - 22:00 WIB",
            locationName = "Aula Serbaguna Kelurahan",
            locationAddress = "Jl. Raya Sukamaju No. 45",
            latitude = -6.2140,
            longitude = 106.8430,
            targetRegion = "RW 05 Kelurahan Sukamaju",
            organizerRole = UserRole.RW,
            organizerName = "Bpk. Sutrisno (Ketua RW 05)",
            confirmedCount = 65,
            maybeCount = 12,
            quota = 100,
            userRsvpStatus = RsvpStatus.ATTENDING,
            photos = listOf("rapat_1"),
            imageUrl = "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.WAITING_ADMIN_APPROVAL,
            needsFollowUp = true,
            followUpNote = "Memerlukan ACC dari Staf Kelurahan",
            isFeatured = false
        ),
        ActivityItem(
            id = "ACT-104",
            title = "Pemeriksaan Kesehatan Gratis & Cek Gula Darah Lansia",
            description = "Kerjasama Kelurahan Sukamaju dengan Puskesmas Kecamatan. Layanan meliputi tes tensi darah, kolesterol, gula darah, dan konsultasi dokter umum secara gratis.",
            category = ActivityCategory.KESEHATAN,
            dateIso = "2025-05-28",
            formattedDate = "Rabu, 28 Mei 2025",
            timeSlot = "08:30 - 12:00 WIB",
            locationName = "Puskesmas Pembantu Sukamaju",
            locationAddress = "Jl. Anggrek No. 8, RW 05",
            latitude = -6.2135,
            longitude = 106.8445,
            targetRegion = "Warga Lansia & Umum RW 05",
            organizerRole = UserRole.POSYANDU,
            organizerName = "Kader Kesehatan Posyandu Lansia",
            confirmedCount = 38,
            maybeCount = 4,
            quota = 80,
            userRsvpStatus = RsvpStatus.MAYBE,
            photos = listOf("kesehatan_1"),
            imageUrl = "https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.PUBLISHED,
            isFeatured = false
        ),
        ActivityItem(
            id = "ACT-105",
            title = "Penyaluran Bantuan Sembako Beras Bansos Tahap II",
            description = "Pengambilan paket sembako beras bagi KPM terdaftar. Wajib membawa KTP Asli dan Kartu Keluarga (KK). Tidak dapat diwakilkan tanpa surat kuasa.",
            category = ActivityCategory.SOSIAL,
            dateIso = "2025-06-01",
            formattedDate = "Minggu, 1 Juni 2025",
            timeSlot = "09:00 - 15:00 WIB",
            locationName = "Kantor Kelurahan Sukamaju",
            locationAddress = "Jl. Raya Sukamaju No. 1",
            latitude = -6.2120,
            longitude = 106.8410,
            targetRegion = "KPM RW 01 - RW 08",
            organizerRole = UserRole.STAF_KELURAHAN,
            organizerName = "Seksi Kesra Kelurahan Sukamaju",
            confirmedCount = 110,
            maybeCount = 15,
            quota = 200,
            userRsvpStatus = RsvpStatus.NONE,
            photos = listOf("sosial_1"),
            imageUrl = "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.PUBLISHED,
            isFeatured = false
        )
    )

    val sampleAnnouncements = listOf(
        AnnouncementItem(
            id = "ANN-201",
            title = "Jadwal Pengambilan Kartu Identitas Anak (KIA) Gelombang 3",
            content = "Diberitahukan kepada seluruh warga RT 01 - RT 05 yang telah mengajukan pembuatan KIA bulan April, kartu sudah dapat diambil di Kantor Kelurahan pada jam kerja (08.00 - 15.00 WIB). Bawa fotokopi KK.",
            formattedDate = "15 Mei 2025",
            authorName = "Staf Pelayanan Umum",
            authorRole = "Kelurahan Sukamaju",
            targetRegion = "Semua RW Sukamaju",
            urgency = AnnouncementUrgency.PENTING,
            requirements = listOf("Membawa KTP Asli Orang Tua", "Fotokopi Kartu Keluarga (KK)", "Pengambilan pada jam kerja 08:00 - 15:00"),
            additionalInfo = "Kartu KIA tidak dikenakan biaya apapun (Gratis).",
            imageUrl = "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.PUBLISHED,
            isPinned = true
        ),
        AnnouncementItem(
            id = "ANN-202",
            title = "Waspada Demam Berdarah (DBD) - Imbauan PSN 3M Plus",
            content = "Mengingat curah hujan masih tinggi, mohon warga secara rutin menguras tempat penampungan air, menutup rapat gentong, dan mendaur ulang barang bekas. Kader Jumantik akan melakukan pemantauan jentik Jumat depan.",
            formattedDate = "14 Mei 2025",
            authorName = "Puskesmas & Kader Kesehatan",
            authorRole = "Posyandu RW 05",
            targetRegion = "RW 05 Sukamaju",
            urgency = AnnouncementUrgency.IMBAUAN,
            requirements = listOf("Menguras bak mandi secara rutin", "Menutup penampungan air", "Menerima kunjungan Kader Jumantik"),
            additionalInfo = "Sedia abate gratis di Posyandu RT 03.",
            imageUrl = "https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=800",
            approvalStatus = ApprovalStatus.PUBLISHED,
            isPinned = true
        ),
        AnnouncementItem(
            id = "ANN-203",
            title = "Usulan Penerangan Jalan Umum (PJU) Lorong Gang RT 03",
            content = "Pengajuan bantuan pemasangan 5 titik lampu PJU tenaga surya di lorong Gang Mawar RT 03 untuk meningkatkan keamanan malam hari.",
            formattedDate = "13 Mei 2025",
            authorName = "Bpk. Bambang (Ketua RT 03)",
            authorRole = "Pengurus RT 03",
            targetRegion = "RT 03 / RW 05",
            urgency = AnnouncementUrgency.INFO,
            requirements = listOf("Mendukung pengerjaan teknis", "Menjaga fasilitas bersama"),
            approvalStatus = ApprovalStatus.WAITING_RW_APPROVAL,
            isPinned = false
        )
    )
}
