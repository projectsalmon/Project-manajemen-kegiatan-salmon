package com.salmon.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.ApprovalStatus
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.ActivityCard
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

@Composable
fun AdminHomeScreen(
    viewModel: AppViewModel,
    onCreateActivityClick: () -> Unit,
    onCreateAnnouncementClick: () -> Unit,
    onActivityClick: (ActivityItem) -> Unit,
    onNavigateToActivities: () -> Unit,
    onNavigateToUserManagement: () -> Unit = {}
) {
    val user = viewModel.currentUser
    val role = user.role

    // Multi-Tier Filter for Approval List
    val pendingRwApprovalActivities = viewModel.activities.filter { it.approvalStatus == ApprovalStatus.WAITING_RW_APPROVAL }
    val pendingAdminApprovalActivities = viewModel.activities.filter { it.approvalStatus == ApprovalStatus.WAITING_ADMIN_APPROVAL }

    val activeActivities = viewModel.activities.filter { it.approvalStatus == ApprovalStatus.PUBLISHED }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Admin Header Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = SkyBlueHeader),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f, fill = false)) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = YellowContainer,
                                border = BorderStroke(1.dp, YellowBorderLis)
                            ) {
                                Text(
                                    text = "DASHBOARD KELOLA ${role.code}",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = OnYellowContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = user.name,
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 22.sp
                                ),
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Icon(
                            imageVector = Icons.Default.AdminPanelSettings,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3 Stat Cards Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.15f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "${activeActivities.size}",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Terbit Warga",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.9f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.15f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                val pendingCount = if (role == UserRole.RW) pendingRwApprovalActivities.size else pendingAdminApprovalActivities.size
                                Text(
                                    text = "$pendingCount",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Butuh ACC",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.9f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.15f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                val totalRsvp = activeActivities.sumOf { it.confirmedCount }
                                Text(
                                    text = "$totalRsvp",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Total RSVP",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.9f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        }

        // Prominent Action Buttons
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Kelola Warga & Role Akun Button (Khusus Admin / Staf Kelurahan & RW)
                if (user.isAdmin || role == UserRole.STAF_KELURAHAN || role == UserRole.RW) {
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
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
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
                                    text = "Kelola Warga & Hak Akses Role",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextNavyDark
                                )
                                Text(
                                    text = "Lihat akun warga terdaftar & beri peran RT/RW/Posyandu",
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
                }

                Button(
                    onClick = onCreateActivityClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = YellowHighlight,
                        contentColor = OnYellowContainer
                    )
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.AddCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Buat Kegiatan Baru",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                OutlinedButton(
                    onClick = onCreateAnnouncementClick,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, SkyBlueHeader)
                ) {
                    Icon(imageVector = Icons.Default.Campaign, contentDescription = null, tint = SkyBlueHeader)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Terbitkan Pengumuman Resmi",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = SkyBlueHeader,
                        maxLines = 1,
                        softWrap = false
                    )
                }
            }
        }

        // --- MULTI-TIER APPROVAL PIPELINE LIST FOR RW ---
        if (role == UserRole.RW && pendingRwApprovalActivities.isNotEmpty()) {
            item {
                Text(
                    text = "Pengajuan Kegiatan RT Menunggu ACC RW (${pendingRwApprovalActivities.size})",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    ),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            items(pendingRwApprovalActivities) { activity ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.5.dp, YellowBorderLis),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = YellowContainer
                            ) {
                                Text(
                                    text = activity.approvalStatus.label,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = OnYellowContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                            Text(
                                text = activity.formattedDate,
                                style = MaterialTheme.typography.labelSmall,
                                color = TextNavyMuted
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = activity.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Pengaju: ${activity.organizerName} (${activity.organizerRole.title})",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.rwRejectActivity(activity.id) },
                                border = BorderStroke(1.dp, UrgentRed),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Tolak", color = UrgentRed, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { viewModel.rwApproveActivity(activity.id) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = YellowHighlight,
                                    contentColor = OnYellowContainer
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("ACC ke Kelurahan", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            }
                        }
                    }
                }
            }
        }

        // --- MULTI-TIER APPROVAL PIPELINE LIST FOR STAF KELURAHAN ---
        if (role == UserRole.STAF_KELURAHAN && pendingAdminApprovalActivities.isNotEmpty()) {
            item {
                Text(
                    text = "Pengajuan Disetujui RW Menunggu ACC Kelurahan (${pendingAdminApprovalActivities.size})",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    ),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            items(pendingAdminApprovalActivities) { activity ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.5.dp, SkyBlueHeader),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = SkyBlueSurfaceVariant
                            ) {
                                Text(
                                    text = activity.approvalStatus.label,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = SkyBlueHeader,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                            Text(
                                text = activity.formattedDate,
                                style = MaterialTheme.typography.labelSmall,
                                color = TextNavyMuted
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = activity.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Pengaju: ${activity.organizerName} (${activity.organizerRole.title})",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.adminRejectActivity(activity.id) },
                                border = BorderStroke(1.dp, UrgentRed),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Tolak", color = UrgentRed, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { viewModel.adminApproveActivity(activity.id) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = YellowHighlight,
                                    contentColor = OnYellowContainer
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Setujui & Terbitkan", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            }
                        }
                    }
                }
            }
        }

        // Section: Managed Activities Overview
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Seluruh Agenda Terbit",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    ),
                    modifier = Modifier.weight(1f, fill = false),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                TextButton(onClick = onNavigateToActivities) {
                    Text(text = "Kelola Semua", color = SkyBlueHeader, maxLines = 1, softWrap = false)
                }
            }
        }

        items(activeActivities.take(4)) { activity ->
            ActivityCard(
                activity = activity,
                onCardClick = { onActivityClick(activity) },
                onRsvpClick = { newStatus ->
                    viewModel.updateRsvpStatus(activity.id, newStatus)
                }
            )
        }
    }
}
