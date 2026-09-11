package com.salmon.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.salmon.app.data.models.ActivityCategory
import com.salmon.app.ui.theme.*
import com.salmon.app.utils.ImageUtils
import com.salmon.app.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditActivityScreen(
    viewModel: AppViewModel,
    existingActivityId: String? = null,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current

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
    var uploadedImageUrl by remember(existing) { mutableStateOf(existing?.imageUrl) }
    var isUploadingImage by remember { mutableStateOf(false) }

    // Media Picker Launcher
    val mediaPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            isUploadingImage = true
            val base64 = ImageUtils.uriToBase64(context, uri)
            if (base64 != null) {
                uploadedImageUrl = base64
                viewModel.showToast("Foto kegiatan berhasil dipilih!")
            } else {
                viewModel.showToast("Gagal memproses foto. Silakan coba foto lain.")
            }
            isUploadingImage = false
        }
    }

    // Fallback Content Launcher
    val getContentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            isUploadingImage = true
            val base64 = ImageUtils.uriToBase64(context, uri)
            if (base64 != null) {
                uploadedImageUrl = base64
                viewModel.showToast("Foto kegiatan berhasil dipilih!")
            } else {
                viewModel.showToast("Gagal memproses foto.")
            }
            isUploadingImage = false
        }
    }

    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = TextNavyDark,
        unfocusedTextColor = TextNavyDark,
        focusedLabelColor = SkyBlueHeader,
        unfocusedLabelColor = TextNavySecondary,
        focusedPlaceholderColor = TextNavyMuted,
        unfocusedPlaceholderColor = TextNavyMuted,
        focusedContainerColor = Color.White,
        unfocusedContainerColor = Color.White,
        focusedBorderColor = SkyBlueHeader,
        unfocusedBorderColor = Color(0xFFE2E8F0)
    )

    Scaffold(
        topBar = {
            Surface(
                color = Color.White,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier
                            .size(40.dp)
                            .background(SkyBlueSurfaceVariant, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Tutup",
                            tint = TextNavyDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (existingActivityId == null) "Buat Kegiatan Baru" else "Edit Kegiatan",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            ),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Disinkronkan otomatis ke seluruh perangkat warga",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavySecondary
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
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
                )
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {

            // 1. SECTION: FOTO / POSTER KEGIATAN (PHOTO UPLOAD)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.PhotoCamera,
                            contentDescription = null,
                            tint = SkyBlueHeader,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Foto / Poster Kegiatan",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (!uploadedImageUrl.isNullOrEmpty()) {
                        // Image Preview Card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0xFFF1F5F9))
                        ) {
                            AsyncImage(
                                model = uploadedImageUrl,
                                contentDescription = "Foto Kegiatan",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )

                            // Overlay Action Buttons
                            Row(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        try {
                                            mediaPickerLauncher.launch(
                                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                            )
                                        } catch (e: Exception) {
                                            getContentLauncher.launch("image/*")
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.92f), contentColor = TextNavyDark),
                                    shape = RoundedCornerShape(12.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                                ) {
                                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp), tint = SkyBlueHeader)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Ganti Foto", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                                }

                                IconButton(
                                    onClick = { uploadedImageUrl = null },
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(UrgentRed.copy(alpha = 0.9f), CircleShape)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    } else {
                        // Upload Trigger Box
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .clickable {
                                    try {
                                        mediaPickerLauncher.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    } catch (e: Exception) {
                                        getContentLauncher.launch("image/*")
                                    }
                                },
                            color = SkyBlueSurfaceVariant.copy(alpha = 0.5f),
                            border = BorderStroke(1.5.dp, SkyBlueHeader.copy(alpha = 0.4f)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                if (isUploadingImage) {
                                    CircularProgressIndicator(modifier = Modifier.size(32.dp), color = SkyBlueHeader)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Memproses Gambar...", style = MaterialTheme.typography.labelMedium, color = TextNavySecondary)
                                } else {
                                    Surface(
                                        shape = CircleShape,
                                        color = SkyBlueHeader.copy(alpha = 0.15f),
                                        modifier = Modifier.size(44.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = Icons.Default.AddPhotoAlternate,
                                                contentDescription = null,
                                                tint = SkyBlueHeader,
                                                modifier = Modifier.size(24.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Unggah Foto / Poster Kegiatan",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = TextNavyDark
                                    )
                                    Text(
                                        text = "Klik di sini untuk memilih foto dari galeri HP Anda",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                                        color = TextNavySecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. SECTION: INFORMASI UTAMA & KATEGORI
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Kategori Kegiatan",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Category Chips (Horizontal Scrollable)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ActivityCategory.values().forEach { cat ->
                            val isSelected = cat == selectedCategory
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) cat.containerColor else Color(0xFFF8FAFC),
                                border = BorderStroke(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) cat.badgeColor else Color(0xFFE2E8F0)
                                ),
                                modifier = Modifier.clickable { selectedCategory = cat }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = if (isSelected) cat.badgeColor else Color(0xFFCBD5E1),
                                        modifier = Modifier.size(10.dp)
                                    ) {}
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = cat.displayName,
                                        style = MaterialTheme.typography.labelMedium.copy(
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                        ),
                                        color = if (isSelected) TextNavyDark else TextNavySecondary
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Title Field
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Judul Kegiatan *") },
                        placeholder = { Text("Contoh: Kerja Bakti Massal Kebersihan Lingkungan") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Description Field
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Deskripsi Lengkap Kegiatan *") },
                        placeholder = { Text("Tuliskan tujuan kegiatan, perlengkapan yang perlu dibawa, rundown, dan informasi penting bagi warga...") },
                        colors = textFieldColors,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp),
                        shape = RoundedCornerShape(14.dp),
                        maxLines = 5
                    )
                }
            }

            // 3. SECTION: JADWAL & LOKASI
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Jadwal & Lokasi",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = formattedDate,
                            onValueChange = { formattedDate = it },
                            label = { Text("Tanggal Kegiatan *") },
                            placeholder = { Text("Minggu, 25 Mei 2025") },
                            colors = textFieldColors,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            trailingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(18.dp)) }
                        )

                        OutlinedTextField(
                            value = timeSlot,
                            onValueChange = { timeSlot = it },
                            label = { Text("Waktu *") },
                            placeholder = { Text("08:00 - 11:00 WIB") },
                            colors = textFieldColors,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            trailingIcon = { Icon(Icons.Default.AccessTime, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(18.dp)) }
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = locationName,
                        onValueChange = { locationName = it },
                        label = { Text("Nama Tempat / Titik Kumpul *") },
                        placeholder = { Text("Contoh: Balai Warga RT 03 / Pos Ronda") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        leadingIcon = { Icon(Icons.Default.Place, contentDescription = null, tint = SkyBlueHeader) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Location Quick Suggestions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Balai Warga RT 03", "Posyandu Mawar", "Lapangan RW 05", "Kantor Kelurahan").forEach { sug ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = SkyBlueSurfaceVariant,
                                modifier = Modifier.clickable { locationName = sug }
                            ) {
                                Text(
                                    text = sug,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextNavyDark,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = locationAddress,
                        onValueChange = { locationAddress = it },
                        label = { Text("Alamat / Patokan Lengkap") },
                        placeholder = { Text("Jl. Mawar No. 10 (Samping Masjid Al-Hidayah)") },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )
                }
            }

            // 4. SECTION: SASARAN WILAYAH & KUOTA
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Sasaran & Batas Partisipan",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = targetRegion,
                            onValueChange = { targetRegion = it },
                            label = { Text("Sasaran Wilayah") },
                            placeholder = { Text("RT 03 / RW 05") },
                            colors = textFieldColors,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )

                        OutlinedTextField(
                            value = quotaInput,
                            onValueChange = { quotaInput = it },
                            label = { Text("Batas Kuota (Orang)") },
                            placeholder = { Text("50") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = textFieldColors,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Region Quick Selector
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("RT 01", "RT 02", "RT 03", "Seluruh RW 05", "Tingkat Kelurahan").forEach { reg ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (targetRegion == reg) SkyBlueHeader.copy(alpha = 0.2f) else Color(0xFFF1F5F9),
                                modifier = Modifier.clickable { targetRegion = reg }
                            ) {
                                Text(
                                    text = reg,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = if (targetRegion == reg) FontWeight.Bold else FontWeight.Normal
                                    ),
                                    color = if (targetRegion == reg) SkyBlueHeader else TextNavySecondary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 5. SUBMIT BUTTON
            Button(
                onClick = {
                    if (title.isNotBlank() && description.isNotBlank()) {
                        val quota = quotaInput.toIntOrNull()
                        if (existingActivityId != null) {
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
                                quota = quota,
                                imageUrl = uploadedImageUrl
                            )
                        } else {
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
                                quota = quota,
                                imageUrl = uploadedImageUrl
                            )
                        }
                        onBackClick()
                    } else {
                        viewModel.showToast("Mohon lengkapi judul dan deskripsi kegiatan terlebih dahulu!")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = YellowHighlight,
                    contentColor = OnYellowContainer
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp, pressedElevation = 6.dp)
            ) {
                Icon(imageVector = Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = if (existingActivityId == null) "Terbitkan Kegiatan ke Seluruh Warga" else "Simpan & Sinkronkan Perubahan",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
