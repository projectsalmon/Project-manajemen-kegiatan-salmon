package com.agon.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.agon.app.ui.theme.*
import com.agon.app.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditActivityScreen(
    viewModel: AppViewModel,
    existingActivityId: String? = null,
    onBackClick: () -> Unit
) {
    val existing = remember(existingActivityId, viewModel.activities) {
        viewModel.activities.find { it.id == existingActivityId }
    }

    var title by remember(existing) { mutableStateOf(existing?.title ?: "") }
    var description by remember(existing) { mutableStateOf(existing?.description ?: "") }
    var selectedCategory by remember(existing) { mutableStateOf(existing?.category ?: ActivityCategory.KERJA_BAKTI) }
    var formattedDate by remember(existing) { mutableStateOf(existing?.formattedDate ?: "Minggu, 25 Mei 2025") }
    var dateIso by remember(existing) { mutableStateOf(existing?.dateIso ?: "2025-05-25") }
    var timeSlot by remember(existing) { mutableStateOf(existing?.timeSlot ?: "08:00 - 11:00 WIB") }
    var locationName by remember(existing) { mutableStateOf(existing?.locationName ?: "Balai Warga RT 03") }
    var locationAddress by remember(existing) { mutableStateOf(existing?.locationAddress ?: "Jl. Mawar No. 10") }
    var targetRegion by remember(existing) { mutableStateOf(existing?.targetRegion ?: "RT 03 / RW 05") }
    var quotaInput by remember(existing) { mutableStateOf(existing?.quota?.toString() ?: "50") }

    var isCategoryExpanded by remember { mutableStateOf(false) }

    // High-contrast text field colors
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

    Scaffold(
        topBar = {
            Surface(
                color = Color.White,
                shadowElevation = 3.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Tutup", tint = TextNavyDark)
                    }
                    Text(
                        text = if (existingActivityId == null) "Buat Kegiatan Baru" else "Edit Kegiatan",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(SkyBlueBackground)
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Title Input Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Judul Kegiatan *") },
                    placeholder = { Text("Contoh: Kerja Bakti Massal RT 03") },
                    colors = textFieldColors,
                    modifier = Modifier.fillMaxWidth().padding(4.dp),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
            }

            // Category Selector
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                ExposedDropdownMenuBox(
                    expanded = isCategoryExpanded,
                    onExpandedChange = { isCategoryExpanded = !isCategoryExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedCategory.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Kategori Kegiatan *") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isCategoryExpanded) },
                        colors = textFieldColors,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp)
                            .menuAnchor(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    ExposedDropdownMenu(
                        expanded = isCategoryExpanded,
                        onDismissRequest = { isCategoryExpanded = false }
                    ) {
                        ActivityCategory.values().forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat.displayName, color = TextNavyDark, fontWeight = FontWeight.SemiBold) },
                                onClick = {
                                    selectedCategory = cat
                                    isCategoryExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Description Input
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Deskripsi Lengkap Kegiatan *") },
                    placeholder = { Text("Tuliskan detail perlengkapan yang harus dibawa, rundown, dan informasi penting lainnya...") },
                    colors = textFieldColors,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp)
                        .height(130.dp),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 5
                )
            }

            // Date & Time Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White
                ) {
                    OutlinedTextField(
                        value = formattedDate,
                        onValueChange = { formattedDate = it },
                        label = { Text("Tanggal *") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth().padding(4.dp),
                        shape = RoundedCornerShape(12.dp),
                        trailingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null, tint = SkyBlueHeader) }
                    )
                }

                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White
                ) {
                    OutlinedTextField(
                        value = timeSlot,
                        onValueChange = { timeSlot = it },
                        label = { Text("Waktu Jam *") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth().padding(4.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            // Location Name & Address
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                OutlinedTextField(
                    value = locationName,
                    onValueChange = { locationName = it },
                    label = { Text("Nama Tempat / Lokasi *") },
                    placeholder = { Text("Contoh: Lapangan Bulutangkis RT 03") },
                    colors = textFieldColors,
                    modifier = Modifier.fillMaxWidth().padding(4.dp),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Place, contentDescription = null, tint = SkyBlueHeader) }
                )
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                OutlinedTextField(
                    value = locationAddress,
                    onValueChange = { locationAddress = it },
                    label = { Text("Alamat / Patokan Detail") },
                    placeholder = { Text("Jl. Mawar No. 12 (Depan Pos Ronda)") },
                    colors = textFieldColors,
                    modifier = Modifier.fillMaxWidth().padding(4.dp),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // Target Region & Quota
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White
                ) {
                    OutlinedTextField(
                        value = targetRegion,
                        onValueChange = { targetRegion = it },
                        label = { Text("Sasaran Wilayah") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth().padding(4.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White
                ) {
                    OutlinedTextField(
                        value = quotaInput,
                        onValueChange = { quotaInput = it },
                        label = { Text("Batas Kuota") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth().padding(4.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            // Upload Photo Placeholder Box
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                border = BorderStroke(1.5.dp, YellowBorderLis)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(imageVector = Icons.Default.AddPhotoAlternate, contentDescription = null, tint = SkyBlueHeader)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Unggah Foto / Poster Kegiatan",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Format JPG, PNG (Maks 5MB)",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavyMuted
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Save Button
            Button(
                onClick = {
                    if (title.isNotBlank() && description.isNotBlank()) {
                        val quota = quotaInput.toIntOrNull()
                        if (existingActivityId != null) {
                            // UPDATE EXISTING ENTRY
                            viewModel.updateActivity(
                                id = existingActivityId,
                                title = title,
                                description = description,
                                category = selectedCategory,
                                dateIso = dateIso,
                                formattedDate = formattedDate,
                                timeSlot = timeSlot,
                                locationName = locationName,
                                locationAddress = locationAddress,
                                targetRegion = targetRegion,
                                quota = quota
                            )
                        } else {
                            // CREATE NEW ENTRY
                            viewModel.addActivity(
                                title = title,
                                description = description,
                                category = selectedCategory,
                                dateIso = dateIso,
                                formattedDate = formattedDate,
                                timeSlot = timeSlot,
                                locationName = locationName,
                                locationAddress = locationAddress,
                                targetRegion = targetRegion,
                                quota = quota
                            )
                        }
                        onBackClick()
                    } else {
                        viewModel.showToast("Mohon lengkapi judul dan deskripsi kegiatan!")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = YellowHighlight,
                    contentColor = OnYellowContainer
                )
            ) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (existingActivityId == null) "Publikasikan Kegiatan" else "Simpan Perubahan Kegiatan",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }
        }
    }
}
