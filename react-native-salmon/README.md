# Kegiatan Kelurahan Sukamaju (React Native)

Aplikasi Manajemen Kegiatan & Layanan Wilayah RT/RW Kelurahan Sukamaju berbasis **React Native (Expo + TypeScript)**.

Proyek ini merupakan konversi lengkap dari aplikasi Android native (Kotlin Jetpack Compose) dengan mempertahankan seluruh domain logic, 5 peran pengguna, alur persetujuan bertingkat (*multi-tier approval pipeline*), RSVP kehadiran, dokumentasi kegiatan, integrasi WhatsApp & Peta Navigasi, serta tema visual khas *Sky Blue* & *Yellow Gold*.

---

## 📱 Fitur Utama

1. **5 Peran Pengguna (Multi-Role System)**:
   - **Warga**: Lihat kegiatan resmi, pantau pengumuman, dan konfirmasi kehadiran (RSVP).
   - **Pengurus RT**: Ajukan kegiatan/pengumuman baru wilayah RT (Status: *Menunggu Persetujuan RW*).
   - **Pengurus RW**: Evaluasi & berikan persetujuan (*ACC*) terhadap usulan RT dan teruskan ke Staf Kelurahan.
   - **Kader Posyandu**: Jadwalkan kegiatan penimbangan balita, pemeriksaan kesehatan lansia, dan pantau metrik partisipasi.
   - **Staf Kelurahan**: Pemeriksaan akhir pengajuan dari RW, persetujuan resmi (*ACC Kelurahan*), dan penerbitan ke seluruh warga.

2. **Sistem Approval Bertingkat (Multi-Tier Approval Pipeline)**:
   - RT mengajukan &rarr; Status `WAITING_RW_APPROVAL`
   - RW menyetujui &rarr; Status `WAITING_ADMIN_APPROVAL`
   - Kelurahan menyetujui &rarr; Status `PUBLISHED` (Otomatis tampil pada beranda seluruh warga).

3. **RSVP & Kuota Partisipasi**:
   - Pilihan: **Saya Hadir**, **Ragu-ragu**, dan **Tidak Hadir**.
   - Penambahan/pengurangan kuota real-time dan pencatatan riwayat RSVP di menu Profil.

4. **Kalender Kegiatan**:
   - Kalender visual bulanan dengan indikator titik tanggal kegiatan dan rincian agenda harian.

5. **Papan Pengumuman Resmi**:
   - Pengelompokan urgensi: *PENTING*, *INFORMASI*, *IMBAUAN*, *DARURAT*.
   - Pinning pengumuman krusial & daftar persyaratan berkas warga.

6. **Peta Lokasi & Navigasi**:
   - Pratinjau visual tempat dan tombol *Petunjuk Arah* (membuka Google Maps langsung via Geo URI).

7. **Galeri Dokumentasi Foto**:
   - Pratinjau thumbnail dokumentasi, upload foto baru, dan modal foto fullscreen dengan tombol unduh.

8. **Buku Kontak Wilayah**:
   - Hubungi langsung via **Telepon** atau **WhatsApp** dengan satu sentuhan.
   - Hak admin untuk menambah, mengedit, dan menghapus kontak wilayah.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Masuk ke Direktori Proyek
```bash
cd react-native-salmon
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Server Expo
```bash
npm start
```
Atau:
```bash
# Menjalankan di Android Emulator / Device
npm run android

# Menjalankan di iOS Simulator
npm run ios

# Menjalankan di Web Browser
npm run web
```

---

## 📂 Struktur Proyek

```
react-native-salmon/
├── App.tsx                      # Root Application & Toast Banner
├── index.ts                     # Expo Entry Point
├── app.json                     # Konfigurasi Expo & App Metadata
├── package.json                 # Daftar dependensi & scripts
├── tsconfig.json                # Konfigurasi TypeScript
└── src/
    ├── types/
    │   └── index.ts             # Tipe TypeScript, Enum, dan Model Data
    ├── constants/
    │   ├── theme.ts             # Skema Warna Sky Blue & Yellow Gold
    │   └── sampleData.ts        # Data awal Sukamaju RW 05
    ├── context/
    │   └── AppContext.tsx       # State Management & AsyncStorage Persistence
    ├── components/
    │   ├── CivicTopBar.tsx      # Header & Role Switch Pill
    │   ├── ActivityCard.tsx     # Kartu Kegiatan & RSVP
    │   ├── AnnouncementCard.tsx # Kartu Pengumuman
    │   ├── RoleSwitchSheet.tsx  # Bottom Sheet Ganti Peran Cepat
    │   └── MapPreviewCard.tsx   # Kartu Peta & Navigasi
    ├── screens/
    │   ├── LoginScreen.tsx              # Pilihan Role Login
    │   ├── WargaHomeScreen.tsx          # Beranda Warga
    │   ├── PosyanduHomeScreen.tsx       # Beranda Kader Posyandu
    │   ├── AdminHomeScreen.tsx          # Beranda RT/RW/Kelurahan & Approval
    │   ├── ActivityListScreen.tsx       # Daftar & Filter Kegiatan
    │   ├── ActivityDetailScreen.tsx     # Detail Kegiatan & Galeri Foto
    │   ├── CreateEditActivityScreen.tsx # Form Buat/Edit Kegiatan
    │   ├── AnnouncementListScreen.tsx   # Daftar & Buat Pengumuman
    │   ├── CalendarScreen.tsx           # Kalender Agenda
    │   └── ProfileScreen.tsx            # Profil, RSVP History & Kontak
    └── navigation/
        └── AppNavigator.tsx     # Konfigurasi Stack & Bottom Tab Navigation
```
