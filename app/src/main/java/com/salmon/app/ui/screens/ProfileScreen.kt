package com.salmon.app.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.ContactItem
import com.salmon.app.data.models.RsvpStatus
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.RoleSwitchSheet
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.layout.ContentScale
import coil3.compose.AsyncImage
import com.salmon.app.ui.dialogs.AppConfigDialog
import com.salmon.app.utils.ImageUtils

@Composable
fun ProfileScreen(
    viewModel: AppViewModel,
    onActivityClick: (String) -> Unit,
    onLogoutToLogin: () -> Unit,
    onNavigateToUserManagement: () -> Unit = {}
) {
    val user = viewModel.currentUser
    val context = LocalContext.current
    val isAdmin = user.role != UserRole.WARGA

    var showRoleSheet by remember { mutableStateOf(false) }
    var showAppConfigDialog by remember { mutableStateOf(false) }

    // Profile Photo Picker Launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            val base64 = ImageUtils.uriToBase64(context, uri)
            if (base64 != null) {
                viewModel.updateProfilePhoto(base64)
            } else {
                viewModel.showToast("Gagal memproses gambar foto profil.")
            }
        }
    }

    val getContentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val base64 = ImageUtils.uriToBase64(context, uri)
            if (base64 != null) {
                viewModel.updateProfilePhoto(base64)
            } else {
                viewModel.showToast("Gagal memproses gambar foto profil.")
            }
        }
    }

    // Contact Edit & Create State
    var showContactDialog by remember { mutableStateOf(false) }
    var editingContact by remember { mutableStateOf<ContactItem?>(null) }

    // High-contrast text field colors
    val textFieldColors = civicTextFieldColors()

    // RSVP History items (filtered where user responded)
    val rsvpHistory = viewModel.activities.filter { it.userRsvpStatus != RsvpStatus.NONE }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SkyBlueBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. User Profile Identity Header Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = SkyBlueHeader),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Interactive Avatar with Camera Edit Badge
                Box(
                    modifier = Modifier.size(86.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Color.White,
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable {
                                try {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                } catch (e: Exception) {
                                    getContentLauncher.launch("image/*")
                                }
                            },
                        shadowElevation = 4.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (user.avatarUrl.isNotBlank()) {
                                AsyncImage(
                                    model = user.avatarUrl,
                                    contentDescription = "Foto Profil",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else {
                                Text(
                                    text = user.name.take(1).uppercase(),
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = SkyBlueHeader
                                    )
                                )
                            }
                        }
                    }

                    // Camera badge button
                    Surface(
                        shape = CircleShape,
                        color = YellowHighlight,
                        border = BorderStroke(2.dp, Color.White),
                        modifier = Modifier
                            .size(28.dp)
                            .align(Alignment.BottomEnd)
                            .clickable {
                                try {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                } catch (e: Exception) {
                                    getContentLauncher.launch("image/*")
                                }
                            },
                        shadowElevation = 2.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = "Ubah Foto Profil",
                                tint = OnYellowContainer,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.clickable {
                        try {
                            photoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        } catch (e: Exception) {
                            getContentLauncher.launch("image/*")
                        }
                    }
                ) {
                    Text(
                        text = "Ganti Foto Profil",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 22.sp
                    )
                )

                Text(
                    text = user.email.ifBlank { "NIK: ${user.nik}" },
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.9f)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Role Pill Badge
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (user.isAdmin) UrgentRedContainer else YellowContainer,
                    border = BorderStroke(1.dp, if (user.isAdmin) UrgentRed else YellowBorderLis)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(if (user.isAdmin) UrgentRed else OnYellowContainer)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (user.isAdmin) "ADMINISTRATOR (AKSES PENUH)" else "MEMBER (${user.role.title})",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = if (user.isAdmin) UrgentRed else OnYellowContainer
                            )
                        )
                    }
                }
            }
        }

        // Domisili & Resident Info Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, SkyBlueSurfaceVariant),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Informasi Domisili & Warga",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                InfoRow(label = "Kelurahan", value = user.kelurahan)
                InfoRow(label = "RW", value = user.rw)
                InfoRow(label = "RT", value = user.rt)
                InfoRow(label = "No. HP / WhatsApp", value = user.phone)
                InfoRow(label = "Email", value = user.email)
            }
        }

        // 2a. SECTION: "Riwayat RSVP Saya"
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.5.dp, YellowBorderLis),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.History, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Riwayat RSVP Saya",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextNavyDark
                            )
                        )
                    }

                    Surface(
                        shape = CircleShape,
                        color = YellowContainer
                    ) {
                        Text(
                            text = "${rsvpHistory.size} Kegiatan",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = OnYellowContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (rsvpHistory.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Belum ada riwayat RSVP. Silakan pilih status kehadiran pada daftar kegiatan.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavyMuted
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        rsvpHistory.forEach { activity ->
                            RsvpHistoryRowItem(
                                activity = activity,
                                onClick = { onActivityClick(activity.id) }
                            )
                        }
                    }
                }
            }
        }

        // 2b. SECTION: "Kontak Penting" (Editable & WhatsApp Button)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, SkyBlueSurfaceVariant),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.PhoneInTalk, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Kontak Penting Wilayah",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextNavyDark
                            )
                        )
                    }

                    if (isAdmin) {
                        IconButton(
                            onClick = {
                                editingContact = null
                                showContactDialog = true
                            }
                        ) {
                            Icon(imageVector = Icons.Default.AddCircle, contentDescription = "Tambah Kontak", tint = SkyBlueHeader)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Group Contacts by Category
                val groupedContacts = viewModel.contacts.groupBy { it.category }

                groupedContacts.forEach { (category, contactList) ->
                    ContactGroupHeader(category)
                    contactList.forEach { contact ->
                        ContactRowItem(
                            contact = contact,
                            isAdmin = isAdmin,
                            onCallClick = { dialPhone(context, contact.phoneNumber) },
                            onWhatsAppClick = { openWhatsApp(context, contact.phoneNumber) },
                            onEditClick = {
                                editingContact = contact
                                showContactDialog = true
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // Kelola Warga & Hak Akses (Khusus Admin / Staf Kelurahan & RW)
        if (user.isAdmin || user.role == UserRole.STAF_KELURAHAN || user.role == UserRole.RW) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToUserManagement() },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.5.dp, SkyBlueHeader),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = SkyBlueHeader.copy(alpha = 0.15f),
                        modifier = Modifier.size(42.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.ManageAccounts,
                                contentDescription = null,
                                tint = SkyBlueHeader,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Kelola Warga & Hak Akses",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Lihat akun warga terdaftar & atur perannya",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavySecondary
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = SkyBlueHeader
                    )
                }
            }

            // Pengaturan Identitas Wilayah & Kelurahan
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showAppConfigDialog = true },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFCBD5E1)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = YellowHighlight.copy(alpha = 0.2f),
                        modifier = Modifier.size(42.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.LocationCity,
                                contentDescription = null,
                                tint = OnYellowContainer,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Pengaturan Identitas Kelurahan & Wilayah",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Ubah judul header aplikasi, nama kelurahan, dan RW",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavySecondary
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = TextNavyMuted
                    )
                }
            }
        }

        // Action Buttons: Switch Role & Logout
        OutlinedButton(
            onClick = { showRoleSheet = true },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, SkyBlueHeader)
        ) {
            Icon(imageVector = Icons.Default.SwapVert, contentDescription = null, tint = SkyBlueHeader)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Ganti Peran Pengguna (Demo Role Switch)", color = SkyBlueHeader, fontWeight = FontWeight.Bold)
        }

        Button(
            onClick = onLogoutToLogin,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = UrgentRed)
        ) {
            Icon(imageVector = Icons.Default.Logout, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Keluar dari Aplikasi", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(30.dp))
    }

    // Role Switch Dialog
    if (showRoleSheet) {
        RoleSwitchSheet(
            currentRole = user.role,
            onRoleSelected = { newRole ->
                viewModel.switchRole(newRole)
            },
            onDismiss = { showRoleSheet = false }
        )
    }

    // App & Kelurahan Identity Config Dialog
    if (showAppConfigDialog) {
        AppConfigDialog(
            currentAppName = viewModel.appName,
            currentKelurahan = viewModel.kelurahanName,
            currentRwScope = viewModel.rwScope,
            onSave = { newAppName, newKelurahan, newRw ->
                viewModel.updateAppConfig(newAppName, newKelurahan, newRw)
            },
            onDismiss = { showAppConfigDialog = false }
        )
    }

    // Create / Edit Contact Dialog
    if (showContactDialog) {
        val targetContact = editingContact
        val isEditing = targetContact != null

        var contactNameTitle by remember(targetContact) { mutableStateOf(targetContact?.nameTitle ?: "") }
        var contactPhone by remember(targetContact) { mutableStateOf(targetContact?.phoneNumber ?: "") }
        var contactCategory by remember(targetContact) { mutableStateOf(targetContact?.category ?: "Kantor Kelurahan Sukamaju") }

        AlertDialog(
            onDismissRequest = {
                showContactDialog = false
                editingContact = null
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (contactNameTitle.isNotBlank() && contactPhone.isNotBlank()) {
                            if (isEditing && targetContact != null) {
                                // UPDATE EXISTING CONTACT (SAME ID)
                                viewModel.updateContact(
                                    id = targetContact.id,
                                    nameTitle = contactNameTitle,
                                    phoneNumber = contactPhone,
                                    category = contactCategory
                                )
                            } else {
                                // CREATE NEW CONTACT
                                viewModel.addContact(
                                    nameTitle = contactNameTitle,
                                    phoneNumber = contactPhone,
                                    category = contactCategory
                                )
                            }
                            showContactDialog = false
                            editingContact = null
                        } else {
                            viewModel.showToast("Mohon lengkapi nama dan nomor telepon!")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = YellowHighlight, contentColor = OnYellowContainer)
                ) {
                    Text(if (isEditing) "Simpan Perubahan" else "Tambah Kontak", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (isEditing && targetContact != null) {
                        // Delete Button with Trash Icon in Red
                        IconButton(
                            onClick = {
                                viewModel.deleteContact(targetContact.id)
                                showContactDialog = false
                                editingContact = null
                            }
                        ) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Hapus Kontak", tint = UrgentRed)
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                    }

                    TextButton(
                        onClick = {
                            showContactDialog = false
                            editingContact = null
                        }
                    ) {
                        Text("Batal", color = TextNavySecondary)
                    }
                }
            },
            title = {
                Text(
                    text = if (isEditing) "Edit Kontak Penting" else "Tambah Kontak Penting Baru",
                    color = TextNavyDark,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = contactNameTitle,
                        onValueChange = { contactNameTitle = it },
                        label = { Text("Nama Kontak & Jabatan *") },
                        placeholder = { Text("Contoh: Bpk. Sutrisno (Ketua RW 05)") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = contactPhone,
                        onValueChange = { contactPhone = it },
                        label = { Text("Nomor Telepon / WhatsApp *") },
                        placeholder = { Text("0812-3456-7890") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = contactCategory,
                        onValueChange = { contactCategory = it },
                        label = { Text("Kategori Wilayah / Jabatan") },
                        placeholder = { Text("Pengurus RT / RW, Kader Posyandu, dll") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )
                }
            },
            shape = RoundedCornerShape(22.dp),
            containerColor = Color.White
        )
    }
}

@Composable
private fun RsvpHistoryRowItem(
    activity: ActivityItem,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = SkyBlueBackground,
        border = BorderStroke(1.dp, SkyBlueSurfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = activity.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = TextNavyDark
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Outlined.Event, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(13.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = activity.formattedDate,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavyMuted
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = activity.userRsvpStatus.color.copy(alpha = 0.15f),
                border = BorderStroke(1.dp, activity.userRsvpStatus.color)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (activity.userRsvpStatus == RsvpStatus.ATTENDING) Icons.Default.CheckCircle else Icons.Default.Info,
                        contentDescription = null,
                        tint = activity.userRsvpStatus.color,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = activity.userRsvpStatus.label,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = activity.userRsvpStatus.color
                    )
                }
            }
        }
    }
}

@Composable
private fun ContactGroupHeader(title: String) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = YellowContainer,
        modifier = Modifier.padding(vertical = 6.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = OnYellowContainer,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun ContactRowItem(
    contact: ContactItem,
    isAdmin: Boolean,
    onCallClick: () -> Unit,
    onWhatsAppClick: () -> Unit,
    onEditClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = contact.nameTitle,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                color = TextNavyDark
            )
            Text(
                text = contact.phoneNumber,
                style = MaterialTheme.typography.bodySmall,
                color = TextNavyMuted
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            // WhatsApp Button
            IconButton(
                onClick = onWhatsAppClick,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = Color(0xFF25D366).copy(alpha = 0.15f),
                    contentColor = Color(0xFF128C7E)
                ),
                modifier = Modifier.size(36.dp)
            ) {
                Icon(imageVector = Icons.Default.Chat, contentDescription = "WhatsApp", modifier = Modifier.size(18.dp))
            }

            // Phone Call Button
            IconButton(
                onClick = onCallClick,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = SkyBlueSurfaceVariant,
                    contentColor = SkyBlueHeader
                ),
                modifier = Modifier.size(36.dp)
            ) {
                Icon(imageVector = Icons.Default.Phone, contentDescription = "Telepon", modifier = Modifier.size(18.dp))
            }

            // Edit Button for Admin
            if (isAdmin) {
                IconButton(
                    onClick = onEditClick,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Kontak",
                        tint = SkyBlueHeader,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

private fun dialPhone(context: Context, phoneNumber: String) {
    try {
        val cleanNumber = phoneNumber.replace("[^0-9+]".toRegex(), "")
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber"))
        context.startActivity(intent)
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun openWhatsApp(context: Context, phoneNumber: String) {
    try {
        val cleanPhone = phoneNumber.replace("[^0-9]".toRegex(), "")
        val formattedPhone = if (cleanPhone.startsWith("0")) "62" + cleanPhone.substring(1) else cleanPhone
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone"))
        context.startActivity(intent)
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextNavyMuted
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
            color = TextNavyDark
        )
    }
}
