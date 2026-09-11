package com.salmon.app.ui.screens

import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import androidx.compose.animation.*
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.salmon.app.data.models.ActivityCategory
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.ActivityCard
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CalendarScreen(
    viewModel: AppViewModel,
    onActivityClick: (ActivityItem) -> Unit,
    onCreateActivityClick: () -> Unit
) {
    val context = LocalContext.current
    val allActivities = viewModel.activities

    // Extract available years dynamically from activities (if no activities exist for a year, don't show it!)
    val availableYears = remember(allActivities) {
        val years = mutableSetOf<Int>()
        // Current year is always available
        val currentYear = Calendar.getInstance().get(Calendar.YEAR)
        years.add(currentYear)

        allActivities.forEach { act ->
            val y = act.dateIso.take(4).toIntOrNull()
            if (y != null) {
                years.add(y)
            }
        }
        years.toList().sortedDescending()
    }

    var selectedYear by remember { mutableStateOf(availableYears.firstOrNull() ?: 2025) }
    var selectedMonth by remember { mutableStateOf(4) } // 0 = Januari, 4 = Mei
    var selectedDay by remember { mutableStateOf(18) }
    var showAllMonthActivities by remember { mutableStateOf(false) }
    var selectedCategoryFilter by remember { mutableStateOf<ActivityCategory?>(null) }

    val monthNames = listOf(
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    )

    // Compute month start day & days count
    val calendarInstance = remember(selectedYear, selectedMonth) {
        Calendar.getInstance().apply {
            set(Calendar.YEAR, selectedYear)
            set(Calendar.MONTH, selectedMonth)
            set(Calendar.DAY_OF_MONTH, 1)
        }
    }

    val daysInMonth = remember(selectedYear, selectedMonth) {
        calendarInstance.getActualMaximum(Calendar.DAY_OF_MONTH)
    }

    // Calendar.SUNDAY = 1, MONDAY = 2, ...
    val startDayOfWeek = remember(selectedYear, selectedMonth) {
        val calDay = calendarInstance.get(Calendar.DAY_OF_WEEK)
        calDay - 1 // 0 for Sunday, 1 for Monday, etc.
    }

    val selectedDateIso = remember(selectedYear, selectedMonth, selectedDay) {
        String.format(Locale.US, "%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay)
    }

    // Filter activities for this month & year
    val monthActivities = remember(allActivities, selectedYear, selectedMonth) {
        allActivities.filter { act ->
            val parts = act.dateIso.split("-")
            if (parts.size >= 2) {
                val y = parts[0].toIntOrNull()
                val m = parts[1].toIntOrNull()
                y == selectedYear && m == (selectedMonth + 1)
            } else false
        }
    }

    // Map day to activities
    val dayActivitiesMap = remember(monthActivities) {
        monthActivities.groupBy { act ->
            act.dateIso.split("-").getOrNull(2)?.toIntOrNull() ?: 0
        }
    }

    // Activities for currently selected day or full month
    val displayedActivities = remember(monthActivities, selectedDay, showAllMonthActivities, selectedCategoryFilter) {
        val list = if (showAllMonthActivities) {
            monthActivities
        } else {
            dayActivitiesMap[selectedDay] ?: emptyList()
        }

        if (selectedCategoryFilter != null) {
            list.filter { it.category == selectedCategoryFilter }
        } else {
            list
        }
    }

    // Find nearest upcoming activity across all activities
    val upcomingActivity = remember(allActivities) {
        val todayIso = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        allActivities.filter { it.dateIso >= todayIso }
            .minByOrNull { it.dateIso }
    }

    val isPastYear = selectedYear < Calendar.getInstance().get(Calendar.YEAR)
    val isAdmin = viewModel.currentUser.role != UserRole.WARGA

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        SkyBlueBackground,
                        Color(0xFFF1F6FB),
                        Color.White
                    )
                )
            ),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. DYNAMIC YEAR SELECTOR (Only shows years with activities!)
        if (availableYears.size > 1) {
            item {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Pilih Tahun Kalender",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavySecondary
                        )
                        if (isPastYear) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = YellowContainer
                            ) {
                                Text(
                                    text = "📂 Arsip Tahun Lalu",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = OnYellowContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        availableYears.forEach { yr ->
                            val isSelected = selectedYear == yr
                            val currentYear = Calendar.getInstance().get(Calendar.YEAR)
                            val label = when {
                                yr == currentYear -> "$yr (Tahun Ini)"
                                yr == currentYear - 1 -> "$yr (Tahun Lalu)"
                                else -> "$yr (Arsip)"
                            }

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) SkyBlueHeader else Color.White,
                                border = BorderStroke(1.dp, if (isSelected) SkyBlueHeader else Color(0xFFE2E8F0)),
                                modifier = Modifier.clickable {
                                    selectedYear = yr
                                }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = if (isSelected) Icons.Default.CalendarToday else Icons.Outlined.CalendarToday,
                                        contentDescription = null,
                                        tint = if (isSelected) Color.White else TextNavyDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelMedium.copy(
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        ),
                                        color = if (isSelected) Color.White else TextNavyDark
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. NEAREST UPCOMING EVENT COUNTDOWN WIDGET
        upcomingActivity?.let { act ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.5.dp, YellowHighlight),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = YellowContainer
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Timer,
                                        contentDescription = null,
                                        tint = OnYellowContainer,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Agenda Terdekat Berikutnya",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = OnYellowContainer
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = act.category.containerColor
                            ) {
                                Text(
                                    text = act.category.displayName,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = act.category.badgeColor,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = act.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AccessTime,
                                    contentDescription = null,
                                    tint = SkyBlueHeader,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${act.formattedDate} • ${act.timeSlot}",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = TextNavyDark
                                )
                            }

                            // Add to Google/Phone Calendar Quick Button
                            Button(
                                onClick = { exportToNativeCalendar(context, act) },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SkyBlueHeader,
                                    contentColor = Color.White
                                ),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.EventAvailable, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Sync Kalender HP", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // 3. INTERACTIVE MONTH CALENDAR CARD
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Month Navigation Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "${monthNames[selectedMonth]} $selectedYear",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 20.sp
                                ),
                                color = SkyBlueHeader
                            )
                            Text(
                                text = "${monthActivities.size} Kegiatan Terjadwal",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextNavySecondary
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = {
                                    if (selectedMonth > 0) {
                                        selectedMonth--
                                    } else {
                                        selectedMonth = 11
                                        selectedYear--
                                    }
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(SkyBlueSurfaceVariant, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ChevronLeft,
                                    contentDescription = "Bulan Sebelumnya",
                                    tint = TextNavyDark,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            IconButton(
                                onClick = {
                                    if (selectedMonth < 11) {
                                        selectedMonth++
                                    } else {
                                        selectedMonth = 0
                                        selectedYear++
                                    }
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(SkyBlueSurfaceVariant, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "Bulan Berikutnya",
                                    tint = TextNavyDark,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Days of week header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        listOf("Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab").forEach { day ->
                            Text(
                                text = day,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = if (day == "Min") UrgentRed else TextNavySecondary,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(8.dp))

                    // 7-Column Day Grid
                    val totalSlots = ((startDayOfWeek + daysInMonth + 6) / 7) * 7
                    val rows = totalSlots / 7

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        for (r in 0 until rows) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                for (c in 0..6) {
                                    val slotIndex = r * 7 + c
                                    val dayNumber = slotIndex - startDayOfWeek + 1

                                    if (dayNumber in 1..daysInMonth) {
                                        val isSelected = dayNumber == selectedDay && !showAllMonthActivities
                                        val activitiesOnDay = dayActivitiesMap[dayNumber] ?: emptyList()
                                        val hasActivity = activitiesOnDay.isNotEmpty()

                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .aspectRatio(1f)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(
                                                    when {
                                                        isSelected -> YellowHighlight
                                                        hasActivity -> SkyBlueSurfaceVariant.copy(alpha = 0.6f)
                                                        else -> Color.Transparent
                                                    }
                                                )
                                                .clickable {
                                                    selectedDay = dayNumber
                                                    showAllMonthActivities = false
                                                },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Text(
                                                    text = "$dayNumber",
                                                    style = MaterialTheme.typography.bodyMedium.copy(
                                                        fontWeight = if (isSelected || hasActivity) FontWeight.Bold else FontWeight.Normal,
                                                        fontSize = 13.sp
                                                    ),
                                                    color = when {
                                                        isSelected -> OnYellowContainer
                                                        c == 0 -> UrgentRed
                                                        hasActivity -> SkyBlueHeader
                                                        else -> TextNavyDark
                                                    }
                                                )

                                                if (hasActivity) {
                                                    Row(
                                                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                                                        modifier = Modifier.padding(top = 2.dp)
                                                    ) {
                                                        activitiesOnDay.take(3).forEach { act ->
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(4.dp)
                                                                    .clip(CircleShape)
                                                                    .background(act.category.badgeColor)
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        // Empty Slot outside current month
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. LIST TOGGLE & CATEGORY FILTER
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (showAllMonthActivities) {
                        "Semua Kegiatan (${monthNames[selectedMonth]} $selectedYear)"
                    } else {
                        "Agenda: $selectedDay ${monthNames[selectedMonth]} $selectedYear"
                    },
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    )
                )

                TextButton(
                    onClick = { showAllMonthActivities = !showAllMonthActivities },
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (showAllMonthActivities) "Lihat Tanggal" else "Lihat Semua Bulan Ini",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = SkyBlueHeader
                    )
                }
            }
        }

        // 5. ACTIVITIES FOR SELECTED DATE OR FULL MONTH
        if (displayedActivities.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.EventBusy,
                            contentDescription = null,
                            tint = TextNavySecondary.copy(alpha = 0.5f),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tidak Ada Kegiatan Terjadwal",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Belum ada agenda warga pada tanggal $selectedDay ${monthNames[selectedMonth]} $selectedYear.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary,
                            textAlign = TextAlign.Center
                        )

                        if (isAdmin) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = onCreateActivityClick,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = YellowHighlight,
                                    contentColor = OnYellowContainer
                                )
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Jadwalkan Kegiatan Tanggal Ini", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        } else {
            items(displayedActivities, key = { it.id }) { activity ->
                Column {
                    ActivityCard(
                        activity = activity,
                        onCardClick = { onActivityClick(activity) },
                        onRsvpClick = { newStatus ->
                            viewModel.updateRsvpStatus(activity.id, newStatus)
                        }
                    )

                    // Quick Native Calendar Sync Action
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(
                            onClick = { exportToNativeCalendar(context, activity) },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Icon(Icons.Default.EditCalendar, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Simpan ke Kalender HP", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SkyBlueHeader)
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

/**
 * Menyinkronkan dan membuka intent kalender bawaan HP / Google Calendar untuk kegiatan tertentu.
 */
private fun exportToNativeCalendar(context: Context, activity: ActivityItem) {
    try {
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = CalendarContract.Events.CONTENT_URI
            putExtra(CalendarContract.Events.TITLE, activity.title)
            putExtra(CalendarContract.Events.DESCRIPTION, "${activity.description}\n\nKategori: ${activity.category.displayName}\nSasaran: ${activity.targetRegion}")
            putExtra(CalendarContract.Events.EVENT_LOCATION, activity.locationName)
            putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, false)

            // Try to parse dateIso + timeSlot
            try {
                val format = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
                val timeStr = if (activity.timeSlot.contains("-")) activity.timeSlot.substringBefore("-").trim() else activity.timeSlot
                val date = format.parse("${activity.dateIso} $timeStr")
                if (date != null) {
                    putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, date.time)
                    putExtra(CalendarContract.EXTRA_EVENT_END_TIME, date.time + 2 * 60 * 60 * 1000) // +2 hours
                }
            } catch (e: Exception) {
                // If time parsing fails, fallback to entire day
            }
        }
        context.startActivity(intent)
    } catch (e: Exception) {
        // Fallback
    }
}
