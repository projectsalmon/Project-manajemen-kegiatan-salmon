package com.agon.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.agon.app.data.models.ActivityCategory
import com.agon.app.data.models.ActivityItem
import com.agon.app.data.models.ApprovalStatus
import com.agon.app.data.models.UserRole
import com.agon.app.ui.components.ActivityCard
import com.agon.app.ui.theme.*
import com.agon.app.viewmodel.AppViewModel

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

    Scaffold(
        floatingActionButton = {
            if (isAdmin) {
                ExtendedFloatingActionButton(
                    onClick = onCreateActivityClick,
                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                    text = { Text("Buat Kegiatan", fontWeight = FontWeight.Bold) },
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
            // Search Input Card Box (Tightly spaced)
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
                    label = { Text("Judul Kegiatan *") },
                    placeholder = { Text("Contoh: Kerja Bakti Massal RT 03") },
                    colors = textFieldColors,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
            }

            // Category Chips Row
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = selectedCategory == null,
                        onClick = {
                            selectedCategory = null
                            viewModel.selectedCategoryFilter = null
                        },
                        label = { Text("Semua Kategori") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = YellowContainer,
                            selectedLabelColor = OnYellowContainer
                        ),
                        leadingIcon = if (selectedCategory == null) {
                            { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        } else null
                    )
                }

                items(ActivityCategory.values()) { category ->
                    val isSelected = selectedCategory == category
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedCategory = if (isSelected) null else category
                            viewModel.selectedCategoryFilter = selectedCategory
                        },
                        label = { Text(category.displayName) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = category.containerColor,
                            selectedLabelColor = category.badgeColor
                        )
                    )
                }
            }

            // Region Filter Chips Row
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(regions) { reg ->
                    val isSelected = selectedRegion == reg
                    SuggestionChip(
                        onClick = {
                            selectedRegion = reg
                            viewModel.selectedRegionFilter = reg
                        },
                        label = { Text(reg, style = MaterialTheme.typography.labelSmall) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = if (isSelected) YellowContainer else Color.White,
                            labelColor = if (isSelected) OnYellowContainer else TextNavyDark
                        )
                    )
                }
            }

            Divider(modifier = Modifier.padding(top = 2.dp, bottom = 2.dp), color = SkyBlueSurfaceVariant)

            // Activities List Content (Tight Top Spacing & Unclipped Bottom Padding)
            if (filteredActivities.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.EventBusy,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = TextNavyMuted
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Tidak Ada Kegiatan Ditemukan",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Coba ubah kata kunci pencarian atau filter wilayah.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextNavySecondary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                searchQuery = ""
                                selectedCategory = null
                                selectedRegion = "Semua Wilayah"
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = YellowHighlight, contentColor = OnYellowContainer)
                        ) {
                            Text("Reset Filter", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp)
                ) {
                    items(filteredActivities) { activity ->
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
            }
        }
    }
}
