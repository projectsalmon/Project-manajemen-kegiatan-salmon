package com.salmon.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.salmon.app.data.models.RsvpStatus
import com.salmon.app.ui.components.ActivityCard
import com.salmon.app.ui.components.AnnouncementCard
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

@Composable
fun WargaHomeScreen(
    viewModel: AppViewModel,
    onNavigateToActivities: () -> Unit,
    onNavigateToAnnouncements: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onActivityClick: (ActivityItem) -> Unit
) {
    val user = viewModel.currentUser
    
    // Only published items appear for Warga
    val publishedActivities = viewModel.activities.filter { it.approvalStatus == ApprovalStatus.PUBLISHED }
    val upcomingActivities = publishedActivities.take(3)
    
    val publishedAnnouncements = viewModel.announcements.filter { it.approvalStatus == ApprovalStatus.PUBLISHED }
    val pinnedAnnouncements = publishedAnnouncements.filter { it.isPinned }.ifEmpty { publishedAnnouncements.take(2) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp)
    ) {
        // Welcome Hero Card in Deep Sky Blue with Yellow Accent Highlights
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
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
                            Text(
                                text = "Selamat Datang, Bapak/Ibu",
                                style = MaterialTheme.typography.labelLarge,
                                color = Color.White.copy(alpha = 0.85f),
                                maxLines = 1,
                                softWrap = false
                            )
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

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = YellowContainer,
                            border = BorderStroke(1.dp, YellowBorderLis)
                        ) {
                            Text(
                                text = "RT ${user.rt} / RW ${user.rw}",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = OnYellowContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Stats Pill Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.15f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "${publishedActivities.size}",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Kegiatan Bulan Ini",
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
                            Column(modifier = Modifier.padding(12.dp)) {
                                val attendingCount = publishedActivities.count { it.userRsvpStatus == RsvpStatus.ATTENDING }
                                Text(
                                    text = "$attendingCount",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Status RSVP Hadir",
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

        // Quick Shortcuts Row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    onClick = onNavigateToActivities,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, YellowBorderLis)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Event, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Semua Kegiatan",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                Surface(
                    onClick = onNavigateToCalendar,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, YellowBorderLis)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.CalendarMonth, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Kalender",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }
            }
        }

        // Section: Pinned Announcements
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pengumuman Penting",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    ),
                    modifier = Modifier.weight(1f, fill = false),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                TextButton(onClick = onNavigateToAnnouncements) {
                    Text(text = "Lihat Semua", color = SkyBlueHeader, maxLines = 1, softWrap = false)
                }
            }
        }

        items(pinnedAnnouncements) { ann ->
            AnnouncementCard(
                announcement = ann,
                onClick = onNavigateToAnnouncements
            )
        }

        // Section: Upcoming Activities in Region
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f, fill = false)) {
                    Text(
                        text = "Kegiatan Mendatang",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Wilayah RT 03 & RW 05",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavyMuted,
                        maxLines = 1,
                        softWrap = false
                    )
                }

                TextButton(onClick = onNavigateToActivities) {
                    Text(text = "Lihat Semua", color = SkyBlueHeader, maxLines = 1, softWrap = false)
                }
            }
        }

        items(upcomingActivities) { activity ->
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
