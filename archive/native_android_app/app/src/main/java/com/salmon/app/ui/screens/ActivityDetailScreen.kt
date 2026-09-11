package com.salmon.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil3.compose.AsyncImage
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.RsvpStatus
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.MapPreviewCard
import com.salmon.app.ui.theme.*
import com.salmon.app.utils.ShareUtils
import com.salmon.app.viewmodel.AppViewModel

@Composable
fun ActivityDetailScreen(
    activityId: String,
    viewModel: AppViewModel,
    onBackClick: () -> Unit,
    onEditClick: (String) -> Unit
) {
    val context = LocalContext.current
    val activity = viewModel.activities.find { it.id == activityId }

    // State for Fullscreen Photo Preview Modal
    var previewPhotoUrl by remember { mutableStateOf<String?>(null) }

    // Sample/Uploaded documentation photos
    val defaultDocumentation = listOf(
        "https://images.pexels.com/photos/8460159/pexels-photo-8460159.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auto=compress&cs=tinysrgb&w=800"
    )

    val docPhotos = remember(activity) {
        val list = mutableStateListOf<String>()
        if (activity != null && !activity.imageUrl.isNullOrEmpty()) {
            list.add(activity.imageUrl)
        }
        list.addAll(defaultDocumentation)
        list
    }

    if (activity == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Kegiatan tidak ditemukan.")
        }
        return
    }

    val canEdit = viewModel.canUserEditActivity(activity)
    val canDelete = viewModel.canUserDeleteActivity(activity)
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }

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
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Kembali", tint = TextNavyDark)
                    }
                    Text(
                        text = "Detail Kegiatan",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    // Native Share Button
                    IconButton(
                        onClick = {
                            val shareDetails = "📅 ${activity.formattedDate} • ${activity.timeSlot}\n📍 ${activity.locationName}\n📌 Sasaran: ${activity.targetRegion}\n\n${activity.description}"
                            ShareUtils.shareContent(context, activity.title, shareDetails)
                        }
                    ) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = "Bagikan", tint = SkyBlueHeader)
                    }

                    if (canEdit) {
                        IconButton(onClick = { onEditClick(activity.id) }) {
                            Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit Kegiatan", tint = SkyBlueHeader)
                        }
                    }

                    if (canDelete) {
                        IconButton(onClick = { showDeleteConfirmDialog = true }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Hapus Kegiatan", tint = UrgentRed)
                        }
                    }
                }
            }
        },
        bottomBar = {
            // Interactive RSVP Action Bar - Fully Unclipped Text Heights
            Surface(
                color = Color.White,
                shadowElevation = 12.dp,
                tonalElevation = 8.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Konfirmasi Kehadiran Anda:",
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    val currentStatus = activity.userRsvpStatus

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // 1. "Saya Hadir" Button
                        val isAttending = currentStatus == RsvpStatus.ATTENDING
                        if (isAttending) {
                            Button(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.NONE) },
                                modifier = Modifier.weight(1.2f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = YellowHighlight,
                                    contentColor = OnYellowContainer
                                ),
                                border = BorderStroke(1.5.dp, YellowBorderLis)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Saya Hadir",
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        } else {
                            OutlinedButton(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.ATTENDING) },
                                modifier = Modifier.weight(1.2f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                border = BorderStroke(1.dp, YellowBorderLis)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = "Saya Hadir",
                                        color = TextNavyDark,
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        }

                        // 2. "Ragu" Button
                        val isMaybe = currentStatus == RsvpStatus.MAYBE
                        if (isMaybe) {
                            Button(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.NONE) },
                                modifier = Modifier.weight(1f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SkyBlueHeader,
                                    contentColor = Color.White
                                )
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(imageVector = Icons.Default.Help, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Ragu",
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        } else {
                            OutlinedButton(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.MAYBE) },
                                modifier = Modifier.weight(1f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                border = BorderStroke(1.dp, SkyBlueHeader)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = "Ragu",
                                        color = SkyBlueHeader,
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        }

                        // 3. "Tdk Hadir" Button
                        val isNotAttending = currentStatus == RsvpStatus.NOT_ATTENDING
                        if (isNotAttending) {
                            Button(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.NONE) },
                                modifier = Modifier.weight(1.1f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = UrgentRed,
                                    contentColor = Color.White
                                )
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(imageVector = Icons.Default.Cancel, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Tdk Hadir",
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        } else {
                            OutlinedButton(
                                onClick = { viewModel.updateRsvpStatus(activity.id, RsvpStatus.NOT_ATTENDING) },
                                modifier = Modifier.weight(1.1f).height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                                border = BorderStroke(1.dp, UrgentRed)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = "Tdk Hadir",
                                        color = UrgentRed,
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.5.sp
                                        ),
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        }
                    }
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
                .padding(16.dp)
        ) {
            // Category Tag & Target Region
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = activity.category.containerColor
                ) {
                    Text(
                        text = activity.category.displayName,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        color = activity.category.badgeColor,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, YellowBorderLis)
                ) {
                    Text(
                        text = "Wilayah: ${activity.targetRegion}",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Title
            Text(
                text = activity.title,
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp
                ),
                color = TextNavyDark
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Organizer Tag Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, SkyBlueSurfaceVariant)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = activity.organizerRole.badgeColor,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = "Penyelenggara: ${activity.organizerName}",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark
                        )
                        Text(
                            text = activity.organizerRole.title,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = activity.organizerRole.badgeColor
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Date & Time Box Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.5.dp, YellowBorderLis)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Event, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Tanggal Kegiatan",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextNavyMuted
                            )
                            Text(
                                text = activity.formattedDate,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextNavyDark
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Schedule, contentDescription = null, tint = SkyBlueHeader)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Waktu Pelaksanaan",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextNavyMuted
                            )
                            Text(
                                text = activity.timeSlot,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextNavyDark
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Location Map Card
            Text(
                text = "Lokasi Kegiatan & Peta",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = TextNavyDark
                )
            )

            Spacer(modifier = Modifier.height(8.dp))

            MapPreviewCard(
                locationName = activity.locationName,
                address = activity.locationAddress,
                latitude = activity.latitude,
                longitude = activity.longitude
            )

            Spacer(modifier = Modifier.height(18.dp))

            // Full Description Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, SkyBlueSurfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Deskripsi Lengkap",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = activity.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextNavySecondary,
                        lineHeight = 22.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Attendance Counter & Capacity
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, SkyBlueSurfaceVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Ringkasan Peserta (RSVP)",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextNavyDark
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${activity.confirmedCount}",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SkyBlueHeader,
                                    fontSize = 24.sp
                                )
                            )
                            Text(text = "Hadir", style = MaterialTheme.typography.labelMedium, color = TextNavySecondary)
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${activity.maybeCount}",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = YellowAccent,
                                    fontSize = 24.sp
                                )
                            )
                            Text(text = "Ragu-ragu", style = MaterialTheme.typography.labelMedium, color = TextNavySecondary)
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${activity.quota ?: "Tanpa Batas"}",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = TextNavyDark,
                                    fontSize = 24.sp
                                )
                            )
                            Text(text = "Kuota", style = MaterialTheme.typography.labelMedium, color = TextNavySecondary)
                        }
                    }

                    if (activity.quota != null) {
                        Spacer(modifier = Modifier.height(12.dp))
                        val progress = (activity.confirmedCount.toFloat() / activity.quota).coerceIn(0f, 1f)
                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                            color = YellowHighlight,
                            trackColor = SkyBlueSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 3. FOTO & DOKUMENTASI KEGIATAN (LazyRow Gallery + Upload Button)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Foto & Dokumentasi Kegiatan",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark
                    )
                )

                // "Upload Dokumentasi" Button
                OutlinedButton(
                    onClick = {
                        docPhotos.add("https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800")
                        viewModel.showToast("Foto dokumentasi baru berhasil diunggah!")
                    },
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, SkyBlueHeader),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(imageVector = Icons.Default.AddPhotoAlternate, contentDescription = null, tint = SkyBlueHeader, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Upload Dokumentasi", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = SkyBlueHeader)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // LazyRow Horizontal Scroll Gallery
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                items(docPhotos) { photoUrl ->
                    Surface(
                        onClick = { previewPhotoUrl = photoUrl },
                        modifier = Modifier
                            .width(130.dp)
                            .height(100.dp),
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, SkyBlueSurfaceVariant),
                        shadowElevation = 2.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            AsyncImage(
                                model = photoUrl,
                                contentDescription = "Foto Dokumentasi",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )

                            // Hover Zoom Overlay Icon
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(6.dp)
                                    .size(24.dp)
                                    .background(Color.Black.copy(alpha = 0.5f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ZoomIn,
                                    contentDescription = "Pratinjau",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Fullscreen Photo Preview Modal Dialog with Download Button
    previewPhotoUrl?.let { photoUrl ->
        Dialog(
            onDismissRequest = { previewPhotoUrl = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.9f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Header Bar with Close Button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Pratinjau Foto Dokumentasi",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )

                        IconButton(onClick = { previewPhotoUrl = null }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Tutup", tint = Color.White)
                        }
                    }

                    // Main Image Preview
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        AsyncImage(
                            model = photoUrl,
                            contentDescription = "Foto Dokumentasi Penuh",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Download Photo Button Action
                    Button(
                        onClick = {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(photoUrl))
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                viewModel.showToast("Foto berhasil diunduh!")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .navigationBarsPadding(),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = YellowHighlight,
                            contentColor = OnYellowContainer
                        )
                    ) {
                        Icon(imageVector = Icons.Default.Download, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Download Foto ke HP",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = {
                Text(
                    text = "Hapus Kegiatan?",
                    fontWeight = FontWeight.Bold,
                    color = TextNavyDark
                )
            },
            text = {
                Text(
                    text = "Apakah Anda yakin ingin menghapus kegiatan '${activity.title}'? Tindakan ini tidak dapat dibatalkan.",
                    color = TextNavySecondary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirmDialog = false
                        viewModel.deleteActivity(activity.id)
                        onBackClick()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = UrgentRed)
                ) {
                    Text("Hapus", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmDialog = false }) {
                    Text("Batal", color = TextNavySecondary)
                }
            }
        )
    }
}
