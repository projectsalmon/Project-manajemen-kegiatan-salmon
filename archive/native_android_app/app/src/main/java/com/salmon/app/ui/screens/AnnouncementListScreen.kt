package com.salmon.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.salmon.app.data.models.AnnouncementItem
import com.salmon.app.data.models.AnnouncementUrgency
import com.salmon.app.data.models.ApprovalStatus
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.AnnouncementCard
import com.salmon.app.ui.theme.*
import com.salmon.app.utils.ImageUtils
import com.salmon.app.utils.ShareUtils
import com.salmon.app.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnnouncementListScreen(
    viewModel: AppViewModel
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedUrgency by remember { mutableStateOf<AnnouncementUrgency?>(null) }

    // Create & Edit State
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingAnnouncement by remember { mutableStateOf<AnnouncementItem?>(null) }
    var selectedAnnouncementForDetail by remember { mutableStateOf<AnnouncementItem?>(null) }

    val userRole = viewModel.currentUser.role
    val isAdmin = userRole != UserRole.WARGA

    val filteredAnnouncements = viewModel.announcements.filter { ann ->
        // Warga only sees PUBLISHED announcements
        val matchesApproval = if (userRole == UserRole.WARGA) {
            ann.approvalStatus == ApprovalStatus.PUBLISHED
        } else {
            true // Management roles see all
        }

        val matchesQuery = searchQuery.isEmpty() ||
                ann.title.contains(searchQuery, ignoreCase = true) ||
                ann.content.contains(searchQuery, ignoreCase = true)

        val matchesUrgency = selectedUrgency == null || ann.urgency == selectedUrgency

        matchesApproval && matchesQuery && matchesUrgency
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SkyBlueBackground)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Cari pengumuman warga...", style = MaterialTheme.typography.bodyMedium, color = TextNavyMuted) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = SkyBlueHeader)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Hapus", tint = TextNavySecondary)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = SkyBlueHeader,
                        unfocusedBorderColor = Color(0xFFE2E8F0),
                        focusedTextColor = TextNavyDark,
                        unfocusedTextColor = TextNavyDark
                    ),
                    singleLine = true
                )
            }

            // 2. Horizontal Urgency Filter Chips
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isAllSelected = selectedUrgency == null
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isAllSelected) YellowContainer else Color.White,
                        border = BorderStroke(1.dp, if (isAllSelected) YellowBorderLis else Color(0xFFE2E8F0)),
                        modifier = Modifier.clickable { selectedUrgency = null }
                    ) {
                        Text(
                            text = "Semua (${viewModel.announcements.size})",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = if (isAllSelected) FontWeight.Bold else FontWeight.Normal
                            ),
                            color = if (isAllSelected) OnYellowContainer else TextNavyDark,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                        )
                    }

                    AnnouncementUrgency.values().forEach { urg ->
                        val isSelected = selectedUrgency == urg
                        val count = viewModel.announcements.count { it.urgency == urg }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) urg.containerColor else Color.White,
                            border = BorderStroke(1.dp, if (isSelected) urg.badgeColor else Color(0xFFE2E8F0)),
                            modifier = Modifier.clickable {
                                selectedUrgency = if (isSelected) null else urg
                            }
                        ) {
                            Text(
                                text = "${urg.label} ($count)",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                ),
                                color = if (isSelected) urg.badgeColor else TextNavyDark,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }

            // 3. Announcement Cards List
            if (filteredAnnouncements.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = null,
                                tint = TextNavySecondary.copy(alpha = 0.5f),
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Tidak Ada Pengumuman Ditemukan",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextNavyDark
                            )
                            Text(
                                text = "Belum ada pengumuman untuk kriteria pencarian ini.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextNavySecondary
                            )
                        }
                    }
                }
            } else {
                items(filteredAnnouncements, key = { it.id }) { ann ->
                    AnnouncementCard(
                        announcement = ann,
                        onClick = { selectedAnnouncementForDetail = ann },
                        onEditClick = if (isAdmin) {
                            {
                                editingAnnouncement = ann
                                showCreateDialog = true
                            }
                        } else null
                    )
                }
            }

            // Spacer for scroll comfort above bottom navigation
            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }

        // Floating Action Button for Admin
        if (isAdmin) {
            ExtendedFloatingActionButton(
                onClick = {
                    editingAnnouncement = null
                    showCreateDialog = true
                },
                icon = { Icon(Icons.Default.Campaign, contentDescription = null) },
                text = { Text("Buat Pengumuman", fontWeight = FontWeight.Bold) },
                containerColor = YellowHighlight,
                contentColor = OnYellowContainer,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 16.dp, bottom = 16.dp)
            )
        }
    }

    // Detail Announcement Dialog Modal
    selectedAnnouncementForDetail?.let { ann ->
        AlertDialog(
            onDismissRequest = { selectedAnnouncementForDetail = null },
            confirmButton = {
                TextButton(onClick = { selectedAnnouncementForDetail = null }) {
                    Text("Tutup", fontWeight = FontWeight.Bold, color = SkyBlueHeader)
                }
            },
            title = {
                Column {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = ann.urgency.containerColor,
                        border = BorderStroke(1.dp, ann.urgency.badgeColor)
                    ) {
                        Text(
                            text = ann.urgency.label,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = ann.urgency.badgeColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = ann.title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState())
                ) {
                    if (!ann.imageUrl.isNullOrEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFF1F5F9))
                        ) {
                            AsyncImage(
                                model = ann.imageUrl,
                                contentDescription = "Foto Pengumuman",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    Text(
                        text = ann.content,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextNavyDark
                    )

                    if (ann.requirements.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Persyaratan & Perlengkapan Warga:",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        ann.requirements.forEach { req ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = YellowContainer,
                                border = BorderStroke(1.dp, YellowBorderLis),
                                modifier = Modifier.padding(vertical = 2.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Assignment,
                                        contentDescription = null,
                                        tint = OnYellowContainer,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = req,
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = OnYellowContainer
                                    )
                                }
                            }
                        }
                    }

                    if (!ann.additionalInfo.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Catatan Tambahan: ${ann.additionalInfo}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Diterbitkan oleh: ${ann.authorName} (${ann.authorRole})",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavyMuted
                    )
                }
            },
            shape = RoundedCornerShape(22.dp),
            containerColor = Color.White
        )
    }

    // Create / Edit Announcement Dialog
    if (showCreateDialog) {
        val targetItem = editingAnnouncement
        val isEditing = targetItem != null

        var annTitle by remember(targetItem) { mutableStateOf(targetItem?.title ?: "") }
        var annContent by remember(targetItem) { mutableStateOf(targetItem?.content ?: "") }
        var annUrgency by remember(targetItem) { mutableStateOf(targetItem?.urgency ?: AnnouncementUrgency.INFO) }
        var annTargetRegion by remember(targetItem) { mutableStateOf(targetItem?.targetRegion ?: "Seluruh Warga RW 05") }
        var requirementsText by remember(targetItem) { mutableStateOf(targetItem?.requirements?.joinToString(", ") ?: "") }
        var additionalInfoInput by remember(targetItem) { mutableStateOf(targetItem?.additionalInfo ?: "") }
        var annImageUrl by remember(targetItem) { mutableStateOf(targetItem?.imageUrl) }
        var isUploadingPhoto by remember { mutableStateOf(false) }

        val annPhotoPicker = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.PickVisualMedia()
        ) { uri: Uri? ->
            if (uri != null) {
                isUploadingPhoto = true
                val base64 = ImageUtils.uriToBase64(context, uri)
                if (base64 != null) {
                    annImageUrl = base64
                    viewModel.showToast("Foto pengumuman berhasil dipilih!")
                }
                isUploadingPhoto = false
            }
        }

        val annContentPicker = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent()
        ) { uri: Uri? ->
            if (uri != null) {
                isUploadingPhoto = true
                val base64 = ImageUtils.uriToBase64(context, uri)
                if (base64 != null) {
                    annImageUrl = base64
                    viewModel.showToast("Foto pengumuman berhasil dipilih!")
                }
                isUploadingPhoto = false
            }
        }

        AlertDialog(
            onDismissRequest = {
                showCreateDialog = false
                editingAnnouncement = null
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (annTitle.isNotBlank() && annContent.isNotBlank()) {
                            val reqList = requirementsText.split(",")
                                .map { it.trim() }
                                .filter { it.isNotEmpty() }

                            if (isEditing && targetItem != null) {
                                viewModel.updateAnnouncement(
                                    id = targetItem.id,
                                    title = annTitle,
                                    content = annContent,
                                    urgency = annUrgency,
                                    targetRegion = annTargetRegion,
                                    requirements = reqList,
                                    additionalInfo = additionalInfoInput.ifBlank { null },
                                    imageUrl = annImageUrl
                                )
                            } else {
                                viewModel.addAnnouncement(
                                    title = annTitle,
                                    content = annContent,
                                    urgency = annUrgency,
                                    targetRegion = annTargetRegion,
                                    requirements = reqList,
                                    additionalInfo = additionalInfoInput.ifBlank { null },
                                    imageUrl = annImageUrl
                                )
                            }
                            showCreateDialog = false
                            editingAnnouncement = null
                        } else {
                            viewModel.showToast("Mohon lengkapi judul dan isi pengumuman!")
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = YellowHighlight, contentColor = OnYellowContainer)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (isEditing) "Simpan Perubahan" else "Terbitkan ke Warga", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showCreateDialog = false
                        editingAnnouncement = null
                    }
                ) {
                    Text("Batal", color = TextNavySecondary)
                }
            },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Campaign, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (isEditing) "Edit Pengumuman" else "Terbitkan Pengumuman Baru",
                        color = TextNavyDark,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 480.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Image Upload Preview Box
                    if (!annImageUrl.isNullOrEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFF1F5F9))
                        ) {
                            AsyncImage(
                                model = annImageUrl,
                                contentDescription = "Foto Pengumuman",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            IconButton(
                                onClick = { annImageUrl = null },
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(6.dp)
                                    .size(28.dp)
                                    .background(UrgentRed.copy(alpha = 0.85f), CircleShape)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Hapus", tint = Color.White, modifier = Modifier.size(14.dp))
                            }
                        }
                    } else {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = SkyBlueSurfaceVariant.copy(alpha = 0.5f),
                            border = BorderStroke(1.dp, SkyBlueHeader.copy(alpha = 0.4f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    try {
                                        annPhotoPicker.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    } catch (e: Exception) {
                                        annContentPicker.launch("image/*")
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isUploadingPhoto) "Memproses foto..." else "Lampirkan Foto / Pamflet (Opsional)",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                                    color = TextNavyDark
                                )
                            }
                        }
                    }

                    // Urgency Selector
                    Text(text = "Tingkat Urgensi Pengumuman:", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = TextNavyDark)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        AnnouncementUrgency.values().forEach { u ->
                            val isSelected = annUrgency == u
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSelected) u.containerColor else Color(0xFFF1F5F9),
                                border = BorderStroke(if (isSelected) 1.5.dp else 1.dp, if (isSelected) u.badgeColor else Color(0xFFE2E8F0)),
                                modifier = Modifier.clickable { annUrgency = u }
                            ) {
                                Text(
                                    text = u.label,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    ),
                                    color = if (isSelected) u.badgeColor else TextNavySecondary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = annTitle,
                        onValueChange = { annTitle = it },
                        label = { Text("Judul Pengumuman *", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("Contoh: Pemadaman Listrik Sementara") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodyLarge.copy(color = TextNavyDark, fontWeight = FontWeight.SemiBold),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = annContent,
                        onValueChange = { annContent = it },
                        label = { Text("Isi Pengumuman Lengkap *", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("Tuliskan detail pengumuman resmi bagi warga...") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(color = TextNavyDark),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp),
                        shape = RoundedCornerShape(14.dp),
                        maxLines = 5
                    )

                    OutlinedTextField(
                        value = annTargetRegion,
                        onValueChange = { annTargetRegion = it },
                        label = { Text("Sasaran Wilayah", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("Seluruh Warga RW 05") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(color = TextNavyDark),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = requirementsText,
                        onValueChange = { requirementsText = it },
                        label = { Text("Persyaratan Warga (pisahkan koma)", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("Membawa KTP Asli, Fotokopi KK") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(color = TextNavyDark),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    OutlinedTextField(
                        value = additionalInfoInput,
                        onValueChange = { additionalInfoInput = it },
                        label = { Text("Catatan Tambahan (Opsional)", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("Contoh: Hubungi Pak RW jika ada pertanyaan") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(color = TextNavyDark),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )
                }
            },
            shape = RoundedCornerShape(24.dp),
            containerColor = Color.White
        )
    }
}
