package com.agon.app.ui.screens

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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agon.app.data.models.ActivityItem
import com.agon.app.ui.components.ActivityCard
import com.agon.app.ui.theme.*
import com.agon.app.viewmodel.AppViewModel

@Composable
fun CalendarScreen(
    viewModel: AppViewModel,
    onActivityClick: (ActivityItem) -> Unit,
    onCreateActivityClick: () -> Unit
) {
    var selectedDay by remember { mutableStateOf(18) } // Selected day in May 2025
    val currentMonthName = "Mei 2025"

    val selectedDateIso = "2025-05-${selectedDay.toString().padStart(2, '0')}"

    // Map of days to activity count
    val daysWithActivities = mapOf(
        18 to listOf(viewModel.activities.find { it.id == "ACT-101" }),
        20 to listOf(viewModel.activities.find { it.id == "ACT-102" }),
        24 to listOf(viewModel.activities.find { it.id == "ACT-103" }),
        25 to viewModel.activities.filter { it.dateIso == "2025-05-25" },
        28 to listOf(viewModel.activities.find { it.id == "ACT-104" })
    )

    val activitiesForSelectedDay = viewModel.activities.filter {
        it.dateIso == selectedDateIso
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 80.dp)
    ) {
        // Month Calendar Card Header
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(22.dp),
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
                        Text(
                            text = currentMonthName,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = SkyBlueHeader,
                                fontSize = 20.sp
                            )
                        )

                        Row {
                            IconButton(onClick = { if (selectedDay > 1) selectedDay-- }) {
                                Icon(imageVector = Icons.Default.ChevronLeft, contentDescription = "Sebelumnya", tint = TextNavyDark)
                            }
                            IconButton(onClick = { if (selectedDay < 31) selectedDay++ }) {
                                Icon(imageVector = Icons.Default.ChevronRight, contentDescription = "Selanjutnya", tint = TextNavyDark)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Days of week header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        listOf("Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab").forEach { day ->
                            Text(
                                text = day,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextNavyMuted,
                                modifier = Modifier.width(36.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Calendar Grid Simulation (31 days)
                    val totalDays = 31
                    val startOffset = 4 // May 1, 2025 is Thursday
                    val rows = (totalDays + startOffset + 6) / 7

                    Column {
                        for (r in 0 until rows) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                for (c in 0..6) {
                                    val dayNum = r * 7 + c - startOffset + 1
                                    if (dayNum in 1..totalDays) {
                                        val isSelected = dayNum == selectedDay
                                        val hasActivity = daysWithActivities.containsKey(dayNum)

                                        Box(
                                            modifier = Modifier
                                                .size(40.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    if (isSelected) YellowHighlight else Color.Transparent
                                                )
                                                .clickable { selectedDay = dayNum },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text(
                                                    text = "$dayNum",
                                                    style = MaterialTheme.typography.bodyMedium.copy(
                                                        fontWeight = if (isSelected || hasActivity) FontWeight.Bold else FontWeight.Normal,
                                                        color = if (isSelected) OnYellowContainer else TextNavyDark
                                                    )
                                                )

                                                if (hasActivity) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(5.dp)
                                                            .clip(CircleShape)
                                                            .background(if (isSelected) OnYellowContainer else SkyBlueHeader)
                                                    )
                                                }
                                            }
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.size(40.dp))
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                        }
                    }
                }
            }
        }

        // Agenda for Selected Day
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Agenda $selectedDay Mei 2025",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        )
                    )
                    Text(
                        text = "${activitiesForSelectedDay.size} Kegiatan Terjadwal",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavyMuted
                    )
                }

                if (viewModel.currentUser.role != com.agon.app.data.models.UserRole.WARGA) {
                    IconButton(onClick = onCreateActivityClick) {
                        Icon(imageVector = Icons.Default.AddCircle, contentDescription = "Tambah Kegiatan", tint = YellowAccent)
                    }
                }
            }
        }

        if (activitiesForSelectedDay.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, SkyBlueSurfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(imageVector = Icons.Default.EventAvailable, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tidak Ada Kegiatan Pada Tanggal Ini",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Silakan pilih tanggal lain yang memiliki titik indikator.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary
                        )
                    }
                }
            }
        } else {
            items(activitiesForSelectedDay) { activity ->
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
}
