package com.salmon.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.salmon.app.data.models.ActivityCategory
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.ApprovalStatus
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.ActivityCard
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityListScreen(
    viewModel: AppViewModel,
    onActivityClick: (ActivityItem) -> Unit,
    onCreateActivityClick: () -> Unit,
    onEditActivityClick: ((ActivityItem) -> Unit)? = null
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(viewModel.selectedCategoryFilter) }
    var selectedRegion by remember { mutableStateOf(viewModel.selectedRegionFilter) }

    val userRole = viewModel.currentUser.role
    val regions = listOf("Semua Wilayah", "RT 01", "RT 02", "RT 03", "RT 04", "RW 05", "Kelurahan Sukamaju")
    val isAdmin = userRole != UserRole.WARGA

    // Filtered Activity List
    val filteredActivities = viewModel.activities.filter { item ->
        // Warga only sees PUBLISHED activities
        val matchesApproval = if (userRole == UserRole.WARGA) {
            item.approvalStatus == ApprovalStatus.PUBLISHED
        } else {
            true // Management roles see all
        }

        val matchesQuery = searchQuery.isEmpty() ||
                item.title.contains(searchQuery, ignoreCase = true) ||
                item.description.contains(searchQuery, ignoreCase = true) ||
                item.locationName.contains(searchQuery, ignoreCase = true)

        val matchesCategory = selectedCategory == null || item.category == selectedCategory

        val matchesRegion = selectedRegion == "Semua Wilayah" || item.targetRegion.contains(selectedRegion, ignoreCase = true)

        matchesApproval && matchesQuery && matchesCategory && matchesRegion
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
                    placeholder = { Text("Cari nama kegiatan, lokasi, atau deskripsi...", style = MaterialTheme.typography.bodyMedium, color = TextNavyMuted) },
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

            // 2. Category Filter Chips (Horizontal Scrollable)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isAllSelected = selectedCategory == null
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isAllSelected) YellowContainer else Color.White,
                        border = BorderStroke(1.dp, if (isAllSelected) YellowBorderLis else Color(0xFFE2E8F0)),
                        modifier = Modifier.clickable {
                            selectedCategory = null
                            viewModel.selectedCategoryFilter = null
                        }
                    ) {
                        Text(
                            text = "Semua Kategori (${viewModel.activities.size})",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = if (isAllSelected) FontWeight.Bold else FontWeight.Normal
                            ),
                            color = if (isAllSelected) OnYellowContainer else TextNavyDark,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                        )
                    }

                    ActivityCategory.values().forEach { cat ->
                        val isSelected = selectedCategory == cat
                        val count = viewModel.activities.count { it.category == cat }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) cat.containerColor else Color.White,
                            border = BorderStroke(1.dp, if (isSelected) cat.badgeColor else Color(0xFFE2E8F0)),
                            modifier = Modifier.clickable {
                                selectedCategory = if (isSelected) null else cat
                                viewModel.selectedCategoryFilter = selectedCategory
                            }
                        ) {
                            Text(
                                text = "${cat.displayName} ($count)",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                ),
                                color = if (isSelected) cat.badgeColor else TextNavyDark,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }

            // 3. Activity List Cards
            if (filteredActivities.isEmpty()) {
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
                                imageVector = Icons.Default.EventBusy,
                                contentDescription = null,
                                tint = TextNavySecondary.copy(alpha = 0.5f),
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Tidak Ada Kegiatan Ditemukan",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextNavyDark
                            )
                            Text(
                                text = "Belum ada agenda kegiatan yang cocok dengan kriteria pencarian.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextNavySecondary
                            )
                        }
                    }
                }
            } else {
                items(filteredActivities, key = { it.id }) { activity ->
                    ActivityCard(
                        activity = activity,
                        onCardClick = { onActivityClick(activity) },
                        onRsvpClick = { newStatus ->
                            viewModel.updateRsvpStatus(activity.id, newStatus)
                        },
                        onEditClick = if (isAdmin && onEditActivityClick != null) {
                            { onEditActivityClick(activity) }
                        } else null
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }

        // Floating Action Button
        if (isAdmin) {
            ExtendedFloatingActionButton(
                onClick = onCreateActivityClick,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Buat Kegiatan", fontWeight = FontWeight.Bold) },
                containerColor = YellowHighlight,
                contentColor = OnYellowContainer,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 16.dp, bottom = 16.dp)
            )
        }
    }
}
