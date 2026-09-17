# DOKUMENTASI PERANCANGAN SISTEM (SKRIPSI TEKNIK INFORMATIKA)
## Aplikasi Komuniva (Sistem Manajemen Kegiatan Warga Terpadu)

Dokumen ini berisi dokumentasi analisis dan perancangan perangkat lunak berbasis **Unified Modeling Language (UML)** dan **Entity Relationship Diagram (ERD)** untuk aplikasi **Komuniva**. Seluruh diagram dirancang menggunakan notasi **Mermaid.js** standar industri agar dapat dirender secara visual pada Markdown viewer, GitHub, Notion, maupun diekspor langsung ke dokumen skripsi (Microsoft Word / LaTeX / PDF).

---

## DAFTAR ISI
1. [Analisis Kebutuhan & Aktor Sistem](#1-analisis-kebutuhan--aktor-sistem)
2. [Use Case Diagram & Spesifikasi Use Case](#2-use-case-diagram)
3. [Entity Relationship Diagram (ERD) & Kamus Data](#3-entity-relationship-diagram-erd)
4. [Activity Diagram (Alur Kerja Proses Bisnis Utama)](#4-activity-diagram)
   - 4.1 Workflow Validasi Kegiatan Multi-Tier (RT -> RW -> Kelurahan)
   - 4.2 Workflow Verifikasi Wilayah Mandiri (Invitation Code)
   - 4.3 Workflow Konfirmasi Kehadiran Warga (RSVP Sync)
5. [Sequence Diagram (Interaksi Antar-Layer Objek)](#5-sequence-diagram)
6. [Flowchart Algoritma & Logika Pemrosesan Sistem](#6-flowchart-algoritma-sistem)

---

## 1. Analisis Kebutuhan & Aktor Sistem

Sistem Komuniva mengimplementasikan mekanisme kendali akses berbasis peran (*Role-Based Access Control / RBAC*) dengan 5 tingkatan aktor utama:

| No | Aktor | Deskripsi Peran & Hak Akses |
|---|---|---|
| 1 | **Warga (Citizen)** | Pengguna umum masyarakat. Berhak membaca kegiatan publik, warta pengumuman, melakukan RSVP kehadiran, memverifikasi wilayah melalui kode undangan RT/RW, dan menerima notifikasi. |
| 2 | **Pengurus RT** | Administrator tingkat RT. Berhak membuat pengajuan kegiatan baru (status awal `WAITING_RW_APPROVAL`), mempublikasikan warta pengumuman tingkat RT, mengenerate kode verifikasi wilayah RT, dan koordinasi via WhatsApp. |
| 3 | **Pengurus RW** | Administrator tingkat RW. Berhak meninjau, menyetujui, atau menolak usulan kegiatan dari seluruh RT di lingkungannya (menaikkan status ke `WAITING_ADMIN_APPROVAL`), serta mengelola kode undangan RW. |
| 4 | **Kader Posyandu** | Penanggung jawab kesehatan keluarga. Berhak membuat jadwal kegiatan posyandu dan imunisasi, serta memantau data balita/kehadiran posyandu. |
| 5 | **Staf Kelurahan (Super Admin)** | Otoritas tertinggi sistem pemerintahan kelurahan. Berhak melakukan verifikasi perizinan final sebelum kegiatan dipublikasikan ke publik (`PUBLISHED`), mengelola akun dan penugasan peran (*role management*), dan menerbitkan warta resmi kelurahan. |

---

## 2. Use Case Diagram

Diagram ini memetakan interaksi antara para aktor dengan fitur-fitur fungsional sistem, lengkap dengan relasi dependensi `<<include>>` dan `<<extend>>`.

```mermaid
graph LR
    %% Definisi Aktor
    Warga(["Warga / Citizen"])
    RT(["Pengurus RT"])
    RW(["Pengurus RW"])
    Posyandu(["Kader Posyandu"])
    Admin(["Staf Kelurahan / Admin"])

    UC_Auth["Login & Registrasi (Google Auth)"]
    UC_Verif["Verifikasi Wilayah (Kode Undangan RT/RW)"]
    UC_ViewAct["Melihat Daftar & Detail Kegiatan"]
    UC_RSVP["Konfirmasi Kehadiran (RSVP & Reminder)"]
    UC_Notif["Menerima Notifikasi & Cek Widget Layar Utama"]
    
    UC_CreateAct["Mengajukan Kegiatan Baru"]
    UC_ApproveRW["Review & Persetujuan Tingkat RW"]
    UC_ApproveAdmin["Review Final & Publikasi Kelurahan"]
    UC_GenerateCode["Generate & Bagikan Kode Undangan Wilayah"]
    UC_WA["Integrasi Koordinasi WhatsApp"]
    
    UC_Announce["Publikasi Warta Pengumuman"]
    UC_PosyanduMetric["Pencatatan Imunisasi & Balita"]
    UC_UserMgmt["Kelola Akun & Penugasan Role"]

    %% Hubungan Aktor Warga
    Warga --> UC_Auth
    Warga --> UC_Verif
    Warga --> UC_ViewAct
    Warga --> UC_RSVP
    Warga --> UC_Notif

    %% Hubungan Aktor RT
    RT --> UC_CreateAct
    RT --> UC_GenerateCode
    RT --> UC_Announce
    RT --> UC_WA

    %% Hubungan Aktor RW
    RW --> UC_ApproveRW
    RW --> UC_GenerateCode
    RW --> UC_WA

    %% Hubungan Aktor Posyandu
    Posyandu --> UC_CreateAct
    Posyandu --> UC_PosyanduMetric

    %% Hubungan Aktor Staf Kelurahan
    Admin --> UC_ApproveAdmin
    Admin --> UC_UserMgmt
    Admin --> UC_Announce

    %% Relasi Include dan Extend
    UC_Verif -.->|include| UC_Auth
    UC_RSVP -.->|include| UC_ViewAct
    UC_RSVP -.->|extend| UC_Notif
    UC_CreateAct -.->|include| UC_ApproveRW
    UC_ApproveRW -.->|include| UC_ApproveAdmin
    UC_ApproveAdmin -.->|extend| UC_WA
    UC_ApproveRW -.->|extend| UC_WA
```

> **Deskripsi untuk Bab 3/4 Skripsi:**
> *Use Case Diagram di atas mendefinisikan batasan hak akses fungsional (Role-Based Access Control) pada sistem Komuniva, di mana pengajuan kegiatan oleh RT mengikutsertakan relasi validasi bertingkat (`<<include>>`) menuju persetujuan Pengurus RW dan validasi final Staf Kelurahan sebelum dapat diakses dan di-RSVP oleh Warga terverifikasi.*

---

## 3. Entity Relationship Diagram (ERD)

Struktur data NoSQL Cloud Firestore yang dimodelkan ke dalam relasi konseptual relasional lengkap dengan Primary Key (PK), Foreign Key (FK), dan kardinalitas antar entitas.

```mermaid
erDiagram
    USERS ||--o{ RSVP_RECORDS : "melakukan"
    USERS ||--o{ ACTIVITIES : "membuat / mengorganisir"
    USERS ||--o{ ANNOUNCEMENTS : "menerbitkan"
    USERS ||--o{ INVITATION_CODES : "menghasilkan"
    
    ACTIVITIES ||--o{ RSVP_RECORDS : "memiliki daftar hadir"
    ACTIVITIES ||--o{ APPROVAL_LOGS : "memiliki riwayat verifikasi"

    USERS {
        string id PK "Google UID / Email"
        string nik "Nomor Induk Kependudukan"
        string name "Nama Lengkap"
        string email "Alamat Surel"
        string phone "Nomor Telepon / WhatsApp"
        string role "WARGA | RT | RW | POSYANDU | STAF_KELURAHAN"
        string rt "Nomor RT domisili"
        string rw "Nomor RW domisili"
        string kelurahan "Nama Kelurahan"
        boolean isVerifiedWarga "Status verifikasi kode wilayah"
        string verifiedCode FK "Relasi ke INVITATION_CODES.code"
        timestamp verifiedAt "Waktu verifikasi sukses"
        string avatarUrl "URL foto profil pengguna"
    }

    ACTIVITIES {
        string id PK "Unique Activity UUID"
        string title "Judul kegiatan"
        string description "Deskripsi lengkap kegiatan"
        string category "GOTONG_ROYONG | KEAGAMAAN | POSYANDU | OLAHRAGA | RAPAT"
        string dateIso "Format tanggal ISO YYYY-MM-DD"
        string formattedDate "Format label tanggal lokal"
        string timeSlot "Waktu kegiatan (e.g. 08:00 - 11:00 WIB)"
        string locationName "Nama lokasi / balai warga"
        string targetRegion "Wilayah sasaran RT/RW"
        string organizerRole "Role pembuat kegiatan"
        string organizerName "Nama koordinator kegiatan"
        int confirmedCount "Jumlah warga hadir"
        int maybeCount "Jumlah warga ragu-ragu"
        int quota "Batas kuota peserta"
        string approvalStatus "WAITING_RW_APPROVAL | WAITING_ADMIN_APPROVAL | PUBLISHED | REJECTED"
        string rejectionReason "Catatan bila ditolak"
        string createdByUserId FK "Relasi ke USERS.id"
        boolean isPinned "Status sematan prioritas"
        boolean isFeatured "Status kartu sorotan dashboard"
    }

    RSVP_RECORDS {
        string id PK "Composite: activityId_userId"
        string activityId FK "Relasi ke ACTIVITIES.id"
        string userId FK "Relasi ke USERS.id"
        string status "ATTENDING | NOT_ATTENDING | MAYBE"
        timestamp updatedAt "Waktu submit konfirmasi"
    }

    ANNOUNCEMENTS {
        string id PK "Announcement UUID"
        string title "Judul warta pengumuman"
        string content "Isi pengumuman"
        string urgency "INFO | PENTING | DARURAT"
        string targetRegion "Target RT/RW"
        string authorRole "Role penulis warta"
        string authorId FK "Relasi ke USERS.id"
        timestamp createdAt "Waktu penerbitan"
    }

    INVITATION_CODES {
        string id PK "Code Document UUID"
        string code "6 digit token unik unik"
        string role "RT | RW"
        string rt "Nomor RT yang diwakili"
        string rw "Nomor RW yang diwakili"
        string kelurahan "Nama Kelurahan"
        string createdByUserId FK "Relasi ke USERS.id"
        int membersCount "Jumlah warga yang terverifikasi via kode"
        boolean isActive "Status keaktifan kode"
    }

    APPROVAL_LOGS {
        string id PK "Log UUID"
        string activityId FK "Relasi ke ACTIVITIES.id"
        string approverId FK "Relasi ke USERS.id"
        string stage "RW_TIER | KELURAHAN_FINAL"
        string action "APPROVED | REJECTED"
        string note "Catatan telaah"
        timestamp timestamp "Waktu eksekusi aksi"
    }
```

> **Deskripsi untuk Bab 3/4 Skripsi:**
> *ERD di atas merefleksikan model data penyimpanan Cloud Firestore yang memetakan relasi one-to-many antara entitas `USERS` dengan `ACTIVITIES`, `ANNOUNCEMENTS`, serta isolasi status kehadiran pada entitas `RSVP_RECORDS` guna mencegah terjadinya race condition saat ratusan warga mengonfirmasi kehadiran secara bersamaan.*

---

## 4. Activity Diagram

### 4.1 Workflow Validasi Kegiatan Multi-Tier (RT -> RW -> Kelurahan)
Alur proses pengajuan usulan kegiatan lingkungan hingga diterbitkan secara resmi ke publik.

```mermaid
stateDiagram-v2
    [*] --> BuatProposal: Pengurus RT mengisi formulir kegiatan baru
    
    BuatProposal --> ValidasiInput: Klik 'Ajukan Kegiatan'
    
    state ValidasiInput <<choice>>
    ValidasiInput --> FormTidakLengkap: Data form belum valid / kosong
    FormTidakLengkap --> BuatProposal: Tampilkan pesan peringatan
    
    ValidasiInput --> SimpanWaitingRW: Data lengkap & valid
    SimpanWaitingRW --> NotifikasiRW: Status kegiatan diset 'WAITING_RW_APPROVAL'
    
    NotifikasiRW --> ReviewRW: Pengurus RW membuka dan menelaah kegiatan
    
    state ReviewRW <<choice>>
    ReviewRW --> TolakRW: RW menolak usulan
    TolakRW --> UpdateStatusDitolak: Status diubah ke 'REJECTED' + Catatan revisi
    UpdateStatusDitolak --> BeritahuPemohon: Notifikasi diteruskan ke Pengurus RT
    BeritahuPemohon --> [*]
    
    ReviewRW --> SetujuiRW: RW menyetujui usulan
    SetujuiRW --> SimpanWaitingAdmin: Status diubah ke 'WAITING_ADMIN_APPROVAL'
    SimpanWaitingAdmin --> ReviewAdmin: Staf Kelurahan memverifikasi perizinan final
    
    state ReviewAdmin <<choice>>
    ReviewAdmin --> TolakAdmin: Staf Kelurahan menolak
    TolakAdmin --> UpdateStatusDitolak
    
    ReviewAdmin --> SetujuiAdmin: Staf Kelurahan menyetujui
    SetujuiAdmin --> PublishKegiatan: Status diubah menjadi 'PUBLISHED'
    PublishKegiatan --> KirimNotifikasiWarga: Push Notification ke Warga & Sinkronisasi Widget
    KirimNotifikasiWarga --> Selesai: Kegiatan resmi tampil di beranda aplikasi
    Selesai --> [*]
```

### 4.2 Workflow Verifikasi Wilayah Mandiri (Invitation Code)
Alur pendaftaran dan validasi domisili Warga secara otomatis menggunakan kode token.

```mermaid
stateDiagram-v2
    [*] --> BukaVerifikasi: Warga mengakses menu 'Verifikasi Wilayah'
    BukaVerifikasi --> MasukkanKode: Input 6-digit kode undangan dari RT/RW
    MasukkanKode --> ValidasiServer: Sistem mencocokkan kode ke koleksi invitationCodes
    
    state ValidasiServer <<choice>>
    ValidasiServer --> KodeSalah: Token tidak ditemukan / status tidak aktif
    KodeSalah --> TampilkanGagal: Muncul pesan 'Kode tidak valid atau kadaluarsa'
    TampilkanGagal --> MasukkanKode: Warga mencoba kembali
    
    ValidasiServer --> KodeValid: Token cocok dan berstatus aktif
    KodeValid --> UpdateProfilWarga: Simpan data RT, RW, dan Kelurahan ke profil
    UpdateProfilWarga --> SetVerifiedTrue: Perbarui atribut isVerifiedWarga = true
    SetVerifiedTrue --> IncrementMemberCount: Tingkatkan counter jumlah warga terdaftar
    IncrementMemberCount --> TampilkanSukses: Notifikasi berhasil & Buka akses dashboard warga
    TampilkanSukses --> [*]
```

> **Deskripsi untuk Bab 3/4 Skripsi:**
> *Activity Diagram memodelkan alur kerja birokrasi perizinan kegiatan warga secara terstruktur, di mana sistem menjamin bahwa seluruh kegiatan yang terbit ke ruang publik telah melewati evaluasi kelayakan berjenjang (decision node) oleh pengurus RW dan validasi administratif Staf Kelurahan.*

---

## 5. Sequence Diagram

Menggambarkan interaksi antar-lapisan arsitektur perangkat lunak (*Separation of Concerns*): **View / UI Screen**, **State Controller (`AppContext`)**, **Service Layer (`firestoreService`)**, **Cloud Firestore**, dan **Native Android Widget**.

```mermaid
sequenceDiagram
    autonumber
    actor Warga as Warga (Aktor)
    participant UI as ActivityDetailScreen (View)
    participant Ctx as AppContext (Controller/State)
    participant Svc as firestoreService (Service Layer)
    participant DB as Cloud Firestore (Database)
    participant Widget as Native Android Widget (Kotlin)

    Warga->>UI: Tekan tombol konfirmasi kehadiran ("Hadir")
    activate UI
    UI->>Ctx: handleRsvp(activityId, "ATTENDING")
    activate Ctx
    
    Ctx->>Ctx: Cek status verifikasi pengguna (isVerifiedWarga)
    alt Pengguna Belum Terverifikasi
        Ctx-->>UI: Lempar status: Pengguna belum terverifikasi
        UI-->>Warga: Munculkan modal dialog "Wajib Verifikasi Wilayah"
    else Pengguna Terverifikasi
        Ctx->>Svc: updateActivityRsvp(activityId, userId, "ATTENDING")
        activate Svc
        
        Svc->>DB: Set Document: /activities/{id}/rsvpUsers/{userId} = "ATTENDING"
        activate DB
        DB-->>Svc: Response 200 OK (Write Acknowledged)
        deactivate DB
        
        Svc->>DB: Atomic Increment: confirmedCount + 1
        activate DB
        DB-->>Svc: Transaction Success
        deactivate DB
        
        Svc-->>Ctx: Return RSVP Result Success
        deactivate Svc
        
        Ctx->>Ctx: Update State Lokal (activities & activeRsvpState)
        Ctx->>Widget: WidgetUpdateModule.updateWidgetData(latestActivities)
        activate Widget
        Widget-->>Ctx: Widget RemoteViews Refreshed
        deactivate Widget
        
        Ctx-->>UI: Callback RSVP Sukses
        deactivate Ctx
        
        UI-->>Warga: Tampilkan Toast "Kehadiran Berhasil Dikonfirmasi" & badge 'Hadir'
    end
    deactivate UI
```

> **Deskripsi untuk Bab 3/4 Skripsi:**
> *Sequence Diagram di atas mendokumentasikan pemisahan tanggung jawab pada arsitektur React Native Komuniva, memperlihatkan bagaimana interaksi penekanan tombol konfirmasi kehadiran pada view diteruskan melalui Context Provider ke service layer secara asinkron, disimpan secara atomik pada basis data Cloud Firestore, dan langsung disinkronkan ke widget layar utama Android.*

---

## 6. Flowchart Algoritma Sistem

Bagan alir logika pemrosesan hak akses (*Role Check*) dan mesin status perizinan (*State Machine Validation*) yang berjalan di balik layar aplikasi.

```mermaid
flowchart TD
    Start([Mulai: Aksi Pengguna]) --> CheckAuth{Apakah Pengguna Terautentikasi?}
    
    CheckAuth -- Tidak --> Ret401[Arahkan ke Layar Google Login] --> End([Selesai])
    CheckAuth -- Ya --> CheckAction{Jenis Aksi Sistem}
    
    %% Cabang Pengajuan Kegiatan Baru
    CheckAction -- Pengajuan Kegiatan --> CheckRolePembuat{Role Pembuat?}
    CheckRolePembuat -- WARGA --> BlockCreate[Tolak: Warga Hanya Berhak Membaca & RSVP] --> End
    CheckRolePembuat -- RT / POSYANDU --> SetDraftRW[Set Status = WAITING_RW_APPROVAL]
    CheckRolePembuat -- RW --> SetDraftAdmin[Set Status = WAITING_ADMIN_APPROVAL]
    CheckRolePembuat -- STAF_KELURAHAN --> SetPublished[Set Status = PUBLISHED]
    
    SetDraftRW --> SaveFirestore[Tulis Dokumen ke Firestore /activities]
    SetDraftAdmin --> SaveFirestore
    SetPublished --> SaveFirestore
    
    %% Cabang Penelaahan / Persetujuan (Approval)
    CheckAction -- Verifikasi Persetujuan --> CheckApproverRole{Role Peninjau?}
    
    CheckApproverRole -- Pengurus RW --> CheckStatusRW{Status Kegiatan Saat Ini?}
    CheckStatusRW -- WAITING_RW_APPROVAL --> DecisionRW{Keputusan RW?}
    DecisionRW -- Disetujui --> TransAdmin[Ubah Status: WAITING_ADMIN_APPROVAL] --> LogHistory[Catat ke Riwayat Approval]
    DecisionRW -- Ditolak --> TransRejectRW[Ubah Status: REJECTED + Alasan] --> LogHistory
    CheckStatusRW -- Selain WAITING_RW_APPROVAL --> RWNoAccess[Tolak: Di luar Wewenang RW] --> End
    
    CheckApproverRole -- Staf Kelurahan --> CheckStatusAdmin{Status Kegiatan Saat Ini?}
    CheckStatusAdmin -- WAITING_ADMIN_APPROVAL --> DecisionAdmin{Keputusan Kelurahan?}
    DecisionAdmin -- Disetujui --> TransPublish[Ubah Status: PUBLISHED] --> TriggerNotification[Trigger Push Notification & Update Widget] --> LogHistory
    DecisionAdmin -- Ditolak --> TransRejectAdmin[Ubah Status: REJECTED + Alasan] --> LogHistory
    CheckStatusAdmin -- Selain WAITING_ADMIN_APPROVAL --> AdminNoAccess[Tolak: Urutan Tahapan Belum Terpenuhi] --> End
    
    LogHistory --> CommitDB[(Komit Transaksi ke Firestore)]
    SaveFirestore --> CommitDB
    CommitDB --> SuccessRes[Kirim Respon Sukses ke Antarmuka Klien] --> End
```

> **Deskripsi untuk Bab 3/4 Skripsi:**
> *Flowchart di atas mengilustrasikan algoritma kendali alur (finite state machine logic) yang mengamankan integritas data pengajuan kegiatan masyarakat, memastikan tidak terjadinya bypass atau pelanggaran hak otorisasi pada setiap tingkatan peran administrasi kependudukan.*

---
*Dokumen ini digenerate secara otomatis berdasarkan analisis kode sumber aplikasi Komuniva (Project Manajemen Kegiatan Salmon) untuk keperluan penyusunan naskah skripsi Program Studi Teknik Informatika.*
