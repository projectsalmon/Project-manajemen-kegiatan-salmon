package com.salmon.app.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.salmon.app.data.models.UserProfile
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUserManagementScreen(
    viewModel: AppViewModel,
    onBackClick: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedRoleFilter by remember { mutableStateOf<UserRole?>(null) }
    var userToEditRole by remember { mutableStateOf<UserProfile?>(null) }

    val allUsers = viewModel.allUsers
    val filteredUsers = remember(allUsers, searchQuery, selectedRoleFilter) {
        allUsers.filter { user ->
            val matchSearch = searchQuery.isBlank() ||
                    user.name.contains(searchQuery, ignoreCase = true) ||
                    user.email.contains(searchQuery, ignoreCase = true) ||
                    user.rt.contains(searchQuery, ignoreCase = true) ||
                    user.rw.contains(searchQuery, ignoreCase = true)

            val matchRole = selectedRoleFilter == null || user.role == selectedRoleFilter
            matchSearch && matchRole
        }
    }

    val totalUsers = allUsers.size
    val totalWarga = allUsers.count { it.role == UserRole.WARGA }
    val totalPengurus = allUsers.count { it.role != UserRole.WARGA }

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
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Kembali",
                            tint = TextNavyDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Kelola Warga & Role Akun",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            ),
                            color = TextNavyDark
                        )
                        Text(
                            text = "Atur hak akses perangkat & peran kepengurusan",
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
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. STAT SUMMARY CARDS
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            color = SkyBlueHeader,
                            shadowElevation = 2.dp
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "$totalUsers",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                                    color = Color.White
                                )
                                Text(
                                    text = "Total Akun",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            shadowElevation = 1.dp
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "$totalPengurus",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                                    color = TextNavyDark
                                )
                                Text(
                                    text = "Pengurus / Staf",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextNavySecondary
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            shadowElevation = 1.dp
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "$totalWarga",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                                    color = SkyBlueHeader
                                )
                                Text(
                                    text = "Warga Biasa",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextNavySecondary
                                )
                            }
                        }
                    }
                }

                // 2. SEARCH BAR
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Cari nama warga, email Google, atau RT/RW...") },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = SkyBlueHeader)
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextNavySecondary)
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

                // 3. ROLE FILTER CHIPS
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // All Chip
                        val isAllSelected = selectedRoleFilter == null
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isAllSelected) SkyBlueHeader else Color.White,
                            border = BorderStroke(1.dp, if (isAllSelected) SkyBlueHeader else Color(0xFFE2E8F0)),
                            modifier = Modifier.clickable { selectedRoleFilter = null }
                        ) {
                            Text(
                                text = "Semua (${allUsers.size})",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = if (isAllSelected) FontWeight.Bold else FontWeight.Normal
                                ),
                                color = if (isAllSelected) Color.White else TextNavyDark,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                            )
                        }

                        UserRole.values().forEach { role ->
                            val isSelected = selectedRoleFilter == role
                            val count = allUsers.count { it.role == role }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) role.badgeColor else Color.White,
                                border = BorderStroke(1.dp, if (isSelected) role.badgeColor else Color(0xFFE2E8F0)),
                                modifier = Modifier.clickable { selectedRoleFilter = role }
                            ) {
                                Text(
                                    text = "${role.title} ($count)",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    ),
                                    color = if (isSelected) Color.White else TextNavyDark,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }

                // 4. USER LIST SECTION
                if (filteredUsers.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 20.dp),
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
                                    imageVector = Icons.Default.GroupOff,
                                    contentDescription = null,
                                    tint = TextNavySecondary.copy(alpha = 0.6f),
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Belum Ada Warga Ditemukan",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = TextNavyDark
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Warga yang login menggunakan akun Google akan otomatis muncul di sini.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextNavySecondary,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }
                } else {
                    items(filteredUsers, key = { it.id }) { user ->
                        CitizenUserCard(
                            user = user,
                            onEditRoleClick = { userToEditRole = user }
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }

    // Role Assignment Dialog Modal
    userToEditRole?.let { targetUser ->
        RoleAssignmentDialog(
            user = targetUser,
            onDismiss = { userToEditRole = null },
            onConfirmRole = { newRole, rt, rw ->
                viewModel.updateUserRole(
                    userId = targetUser.id,
                    newRole = newRole,
                    rt = rt,
                    rw = rw
                )
                userToEditRole = null
            }
        )
    }
}

@Composable
fun CitizenUserCard(
    user: UserProfile,
    onEditRoleClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // User Avatar
                if (user.avatarUrl.isNotBlank()) {
                    AsyncImage(
                        model = user.avatarUrl,
                        contentDescription = user.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(SkyBlueSurfaceVariant)
                    )
                } else {
                    Surface(
                        shape = CircleShape,
                        color = user.role.badgeColor.copy(alpha = 0.15f),
                        modifier = Modifier.size(50.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = user.name.take(1).uppercase(),
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = user.role.badgeColor
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextNavySecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Role Badge
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = user.role.badgeColor.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, user.role.badgeColor.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = user.role.title,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = user.role.badgeColor
                        ),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = SkyBlueHeader,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "RT ${user.rt} / RW ${user.rw} • ${user.kelurahan}",
                        style = MaterialTheme.typography.labelMedium,
                        color = TextNavyDark
                    )
                }

                Button(
                    onClick = onEditRoleClick,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = YellowHighlight,
                        contentColor = OnYellowContainer
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.AdminPanelSettings, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Ubah Role",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    }
}

@Composable
fun RoleAssignmentDialog(
    user: UserProfile,
    onDismiss: () -> Unit,
    onConfirmRole: (UserRole, String, String) -> Unit
) {
    var selectedRole by remember { mutableStateOf(user.role) }
    var rtInput by remember { mutableStateOf(user.rt) }
    var rwInput by remember { mutableStateOf(user.rw) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    onConfirmRole(selectedRole, rtInput, rwInput)
                },
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = YellowHighlight,
                    contentColor = OnYellowContainer
                )
            ) {
                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Tetapkan Role Ini", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal", color = TextNavySecondary)
            }
        },
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = null,
                    tint = SkyBlueHeader,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Beri Role / Hak Akses",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextNavyDark
                    )
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavySecondary
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 440.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Pilih Peran untuk Akun ${user.email}:",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = TextNavyDark
                )

                // Role Options List
                UserRole.values().forEach { role ->
                    val isSelected = selectedRole == role
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedRole = role },
                        shape = RoundedCornerShape(14.dp),
                        color = if (isSelected) role.badgeColor.copy(alpha = 0.1f) else Color(0xFFF8FAFC),
                        border = BorderStroke(
                            width = if (isSelected) 1.5.dp else 1.dp,
                            color = if (isSelected) role.badgeColor else Color(0xFFE2E8F0)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { selectedRole = role },
                                colors = RadioButtonDefaults.colors(selectedColor = role.badgeColor)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Column {
                                Text(
                                    text = role.title,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextNavyDark
                                )
                                Text(
                                    text = role.description,
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                    color = TextNavySecondary
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // RT / RW Input Fields
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = rtInput,
                        onValueChange = { rtInput = it },
                        label = { Text("Nomor RT", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("03") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = TextNavyDark),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = rwInput,
                        onValueChange = { rwInput = it },
                        label = { Text("Nomor RW", fontWeight = FontWeight.SemiBold) },
                        placeholder = { Text("05") },
                        colors = civicTextFieldColors(),
                        textStyle = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = TextNavyDark),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )
                }
            }
        },
        shape = RoundedCornerShape(24.dp),
        containerColor = Color.White
    )
}
