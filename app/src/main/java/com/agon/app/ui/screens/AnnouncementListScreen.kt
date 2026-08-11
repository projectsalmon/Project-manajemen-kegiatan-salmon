package com.agon.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agon.app.data.models.AnnouncementItem
import com.agon.app.data.models.AnnouncementUrgency
import com.agon.app.data.models.ApprovalStatus
import com.agon.app.data.models.UserRole
import com.agon.app.ui.components.AnnouncementCard
import com.agon.app.ui.theme.*
import com.agon.app.utils.ShareUtils
import com.agon.app.viewmodel.AppViewModel

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

    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = TextNavyDark,
        unfocusedTextColor = TextNavyDark,
        focusedLabelColor = SkyBlueHeader,
        unfocusedLabelColor = TextNavyMuted,
        focusedPlaceholderColor = TextNavyMuted,
        unfocusedPlaceholderColor = TextNavyMuted,
        focusedContainerColor = Color.White,
        unfocusedContainerColor = Color.White,
        focusedBorderColor = YellowHighlight,
        unfocusedBorderColor = SkyBlueSurfaceVariant
    )

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

    Scaffold(
        floatingActionButton = {
            if (isAdmin) {
                ExtendedFloatingActionButton(
                    onClick = {
                        editingAnnouncement = null
                        showCreateDialog = true
                    },
                    icon = { Icon(Icons.Default.Campaign, contentDescription = null) },
                    text = { Text("Buat Pengumuman", fontWeight = FontWeight.Bold) },
                    containerColor = YellowHighlight,
                    contentColor = OnYellowContainer
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(SkyBlueBackground)
                .padding(paddingValues)
        ) {
            // Search Input Box (Tightly spaced)
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, top = 6.dp, bottom = 2.dp),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Judul Pengumuman *") },
                    placeholder = { Text("Contoh: Pengambilan KIA") },
                    colors = textFieldColors,
                    modifier = Modifier.fillMaxWidth().padding(4.dp),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
            }

            // Fixed Horizontal Scrollable Urgency Filter Chips
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                item {
                    FilterChip(
                        selected = selectedUrgency == null,
                        onClick = { selectedUrgency = null },
                        label = { Text("Semua") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = YellowContainer,
                            selectedLabelColor = OnYellowContainer
                        )
                    )
                }

                items(AnnouncementUrgency.values()) { urg ->
                    val isSelected = selectedUrgency == urg
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedUrgency = if (isSelected) null else urg },
                        label = { Text(urg.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = urg.containerColor,
                            selectedLabelColor = urg.badgeColor
                        )
                    )
                }
            }

            Divider(modifier = Modifier.padding(top = 2.dp, bottom = 2.dp), color = SkyBlueSurfaceVariant)

            // Announcement List Content (Tight Top Spacing & Unclipped Bottom Padding)
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp)
            ) {
                items(filteredAnnouncements) { ann ->
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
        }
    }

    // Detail Announcement Dialog
    selectedAnnouncementForDetail?.let { ann ->
        AlertDialog(
            onDismissRequest = { selectedAnnouncementForDetail = null },
            confirmButton = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Share Button
                    IconButton(
                        onClick = {
                            val reqText = if (ann.requirements.isNotEmpty()) "\n📋 Persyaratan: ${ann.requirements.joinToString(", ")}" else ""
                            val shareDetails = "📢 Pengumuman: ${ann.targetRegion}\n📅 ${ann.formattedDate}\n\n${ann.content}$reqText"
                            ShareUtils.shareContent(context, ann.title, shareDetails)
                        }
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Bagikan", tint = SkyBlueHeader)
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    if (isAdmin) {
                        TextButton(
                            onClick = {
                                editingAnnouncement = ann
                                selectedAnnouncementForDetail = null
                                showCreateDialog = true
                            }
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Edit")
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                    }

                    Button(
                        onClick = { selectedAnnouncementForDetail = null },
                        colors = ButtonDefaults.buttonColors(containerColor = YellowHighlight, contentColor = OnYellowContainer)
                    ) {
                        Text("Tutup", fontWeight = FontWeight.Bold)
                    }
                }
            },
            title = {
                Text(
                    text = ann.title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = TextNavyDark
                )
            },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = ann.urgency.containerColor
                        ) {
                            Text(
                                text = ann.urgency.label,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = ann.urgency.badgeColor,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }

                        Text(
                            text = ann.formattedDate,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavyMuted
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = ann.content,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextNavySecondary,
                        lineHeight = 22.sp
                    )

                    // Requirements / Additional Info Section
                    if (ann.requirements.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Persyaratan & Dokumen Wajib:",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            ann.requirements.forEach { req ->
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = YellowContainer,
                                    border = BorderStroke(1.dp, YellowBorderLis)
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
                    }

                    if (!ann.additionalInfo.isNull_or_empty()) {
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
        var annTargetRegion by remember(targetItem) { mutableStateOf(targetItem?.targetRegion ?: "RW 05 Sukamaju") }
        var requirementsText by remember(targetItem) { mutableStateOf(targetItem?.requirements?.joinToString(", ") ?: "") }
        var additionalInfoInput by remember(targetItem) { mutableStateOf(targetItem?.additionalInfo ?: "") }

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
                                    additionalInfo = additionalInfoInput.ifBlank { null }
                                )
                            } else {
                                viewModel.addAnnouncement(
                                    title = annTitle,
                                    content = annContent,
                                    urgency = annUrgency,
                                    targetRegion = annTargetRegion,
                                    requirements = reqList,
                                    additionalInfo = additionalInfoInput.ifBlank { null }
                                )
                            }
                            showCreateDialog = false
                            editingAnnouncement = null
                        } else {
                            viewModel.showToast("Mohon lengkapi judul dan isi pengumuman!")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = YellowHighlight, contentColor = OnYellowContainer)
                ) {
                    Text(if (isEditing) "Simpan Perubahan" else "Terbitkan", fontWeight = FontWeight.Bold)
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
                Text(
                    text = if (isEditing) "Edit Pengumuman" else "Terbitkan Pengumuman Baru",
                    color = TextNavyDark,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = annTitle,
                        onValueChange = { annTitle = it },
                        label = { Text("Judul Pengumuman *") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = annContent,
                        onValueChange = { annContent = it },
                        label = { Text("Isi Pengumuman *") },
                        colors = textFieldColors,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = requirementsText,
                        onValueChange = { requirementsText = it },
                        label = { Text("Persyaratan Warga (pisahkan koma)") },
                        placeholder = { Text("Contoh: Membawa KTP Asli, Fotokopi KK") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = additionalInfoInput,
                        onValueChange = { additionalInfoInput = it },
                        label = { Text("Catatan Tambahan (Opsional)") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Text(text = "Tingkat Urgensi:", style = MaterialTheme.typography.labelMedium, color = TextNavyDark)

                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        items(AnnouncementUrgency.values()) { u ->
                            FilterChip(
                                selected = annUrgency == u,
                                onClick = { annUrgency = u },
                                label = { Text(u.label, style = MaterialTheme.typography.labelSmall) }
                            )
                        }
                    }
                }
            },
            shape = RoundedCornerShape(22.dp),
            containerColor = Color.White
        )
    }
}

private fun String?.isNull_or_empty(): Boolean = this.isNullOrEmpty()
