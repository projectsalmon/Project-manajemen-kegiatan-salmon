# Konek Kelurahan (Manajemen Kegiatan Salmon)

Aplikasi manajemen kegiatan kelurahan berbasis **React Native & TypeScript** dengan integrasi **Firebase Auth (Google Play Services)** dan **Cloud Firestore**.

---

## 📱 Ringkasan Proyek
Aplikasi ini ditujukan untuk memfasilitasi koordinasi kegiatan, jadwal, dan pengumuman tingkat kelurahan dengan dukungan 5 peran pengguna (*Warga*, *Pengurus RT/RW*, *Kader Posyandu*, *Staf Kelurahan*, dan *Lurah*).

### Fitur Utama:
* **Google Sign-In Native:** Autentikasi resmi Android menggunakan Google Play Services (`@react-native-google-signin/google-signin`).
* **Realtime Cloud Firestore:** Pengambilan data kegiatan dan pengumuman secara realtime.
* **Manajemen Peran & Alur Approval:** Persetujuan bertingkat kegiatan dan pengumuman.
* **RSVP & Kehadiran:** Konfirmasi kehadiran warga langsung dari aplikasi.
* **Integrasi WhatsApp & Peta Navigasi:** Menghubungi narahubung dan membuka lokasi kegiatan di Google Maps.
* **Standalone Release APK:** Dukungan build mandiri tanpa ketergantungan pada dev server.

---

## 🚀 Cara Menjalankan

### 1. Build APK Mandiri (Offline)
Jalankan file batch:
```cmd
build-apk.bat
```
File APK siap instal akan langsung dihasilkan di root: `Konek-Kelurahan-Update16Ags.apk`.

### 2. Menjalankan di Expo Dev Server
```cmd
start-app.bat
```
Atau secara manual:
```bash
cd react-native-salmon
npx expo start -c
```

### 3. Push Perubahan ke GitHub
```cmd
push-ke-github.bat
```

---

## 📁 Struktur Folder
* `react-native-salmon/src/` : Kode antarmuka (UI), komponen, context, dan navigasi React Native.
* `react-native-salmon/android/` : Bridge sistem Android & konfigurasi Gradle native.
* `firestore.rules` : Aturan keamanan Firebase Firestore.
* `google-services.json` : Konfigurasi layanan Google Cloud & Firebase.