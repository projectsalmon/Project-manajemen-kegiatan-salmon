# Record Pembaruan Aplikasi Konek (Update 11 September 2026)

Dokumen ini mencatat pembaruan dan penyempurnaan menyeluruh untuk aplikasi **Kegiatan Kelurahan (Update 16 Agustus - React Native & Android Native)** di folder `react-native-salmon/`.

---

## 📌 Ringkasan Pekerjaan Hari Ini

### 1. Migrasi & Fokus Penuh ke Versi Update 16 Agustus
- Mengarsipkan proyek lama (`archive/native_android_app/`) dan menetapkan fokus 100% pada aplikasi React Native (`react-native-salmon/`) yang berisi desain modern, integrasi font Plus Jakarta Sans & Open Sans, filter kategori dinamis, approval WhatsApp pengurus wilayah, dan sistem RSVP.

### 2. Penghapusan Menu Bypass Akun Demo
- Menghapus total modal jalan pintas/bypass akun palsu di `LoginScreen.tsx` (`isGoogleModalVisible` dan opsi demo "Salman Akhdan", "Pengurus RT 03", dsb).

### 3. Autentikasi Google Sign-In Native (Google Play Services)
- Mengganti alur otentikasi browser (`expo-auth-session`) yang memicu Google `Error 400: invalid_request` dengan pustaka resmi **`@react-native-google-signin/google-signin`**.
- Tombol **"Sign in with Google"** kini memunculkan *bottom sheet* pemilihan akun Google bawaan HP Android secara langsung tanpa membuka website.
- Menghubungkan ID token Google ke **Firebase Auth** dan menyinkronkan profil ke **Google Cloud Firestore**.

### 4. Perbaikan Kompilasi Native Android (Build Issue Resolution)
- **Windows MAX_PATH (260 Karakter)**: Mengubah arsitektur ke mode stabil (`newArchEnabled=false`) untuk menghindari codegen CMake/Ninja yang melebihi 260 karakter di sistem file Windows.
- **Java Package Path Fix**: Memperbaiki folder paket pada dependensi `@react-native-google-signin` dari `com.reactnativegooglesignin` menjadi struktur direktori Java standar `com/reactnativegooglesignin/`.
- **Standalone Offline Bundle**: Mengonfigurasi `assembleRelease` agar kode JavaScript (Hermes bytecode) dan 64 file aset dibungkus langsung ke dalam APK sehingga terbebas dari pesan merah *"Could not connect to development server"*.

### 5. Pencegahan Force Close (Anti-Crash)
- Menambahkan jeda transisi 150ms setelah pop-up Google Play Services ditutup agar sistem Android tidak mengalami benturan siklus Activity (*lifecycle collision*).
- Menambahkan nilai bawaan aman (*safe fallbacks*) di `ActivityCard.tsx`, `AnnouncementCard.tsx`, dan `ProfileScreen.tsx` untuk mencegah *TypeError* saat membaca data kegiatan Firestore baru.
- Memasang komponen pelindung global **`ErrorBoundary.tsx`** di `App.tsx` agar aplikasi tidak pernah keluar sendiri ke home HP jika terjadi kendala data.

### 6. Otomasi Skrip Build APK
- Memperbarui skrip `build-apk.bat` di folder utama untuk mengompilasi APK Standalone (`assembleRelease`) secara lokal dalam ~40 detik dan langsung menghasilkan file `Konek-Kelurahan-Update16Ags.apk`.

---

## 📁 File yang Berubah Utama
- `react-native-salmon/App.tsx` (Pemasangan ErrorBoundary & konfigurasi root)
- `react-native-salmon/app.json` (Konfigurasi plugin Google Sign-In)
- `react-native-salmon/src/components/ErrorBoundary.tsx` (Komponen penangkap error global)
- `react-native-salmon/src/screens/LoginScreen.tsx` (Google Sign-In native & pembersihan bypass)
- `react-native-salmon/src/components/ActivityCard.tsx` (Safe fallback metadata & RSVP)
- `react-native-salmon/src/components/AnnouncementCard.tsx` (Safe fallback urgency & approval)
- `react-native-salmon/src/screens/ProfileScreen.tsx` (Safe fallback riwayat RSVP)
- `react-native-salmon/src/context/AppContext.tsx` (Safe default data Firestore)
- `build-apk.bat` (Skrip build mandiri otomatis)
- `.gitignore` (Penyempurnaan aturan ignore file binary)
