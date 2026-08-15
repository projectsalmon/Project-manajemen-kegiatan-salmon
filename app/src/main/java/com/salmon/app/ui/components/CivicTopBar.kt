package com.salmon.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CivicTopBar(
    currentRole: UserRole,
    userName: String,
    onRoleClick: () -> Unit,
    onProfileClick: () -> Unit,
    userAvatarUrl: String = "",
    appName: String = "Konek",
    kelurahanName: String = "Sukamaju",
    rwScope: String = "RW 05",
    onAppConfigClick: (() -> Unit)? = null,
    titleOverride: String? = null
) {
    Surface(
        color = Color.White,
        tonalElevation = 2.dp,
        shadowElevation = 3.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title & Subtitle Column (Configurable by Admin)
                Column(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .then(
                            if (onAppConfigClick != null) {
                                Modifier.clickable { onAppConfigClick() }
                            } else Modifier
                        )
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color.Transparent,
                            modifier = Modifier.size(36.dp),
                            shadowElevation = 2.dp
                        ) {
                            androidx.compose.foundation.Image(
                                painter = androidx.compose.ui.res.painterResource(id = com.salmon.app.R.drawable.app_logo),
                                contentDescription = "Logo Konek",
                                contentScale = ContentScale.Fit,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(10.dp))
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = titleOverride ?: appName,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            ),
                            color = TextNavyDark,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (onAppConfigClick != null) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit Nama Kelurahan & Wilayah",
                                tint = SkyBlueHeader.copy(alpha = 0.7f),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                    Text(
                        text = "$kelurahanName • $rwScope",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = TextNavyMuted,
                        maxLines = 1,
                        softWrap = false
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Interactive Role Badge & Avatar
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        onClick = onRoleClick,
                        shape = RoundedCornerShape(20.dp),
                        color = YellowContainer,
                        border = BorderStroke(1.dp, YellowBorderLis)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(OnYellowContainer)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = currentRole.title,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = OnYellowContainer,
                                maxLines = 1,
                                softWrap = false
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Icon(
                                imageVector = Icons.Default.SwapVert,
                                contentDescription = "Ganti Peran",
                                tint = OnYellowContainer,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    // User Profile Avatar (Displays photo if set)
                    Surface(
                        onClick = onProfileClick,
                        shape = CircleShape,
                        color = SkyBlueSurfaceVariant,
                        border = BorderStroke(1.dp, SkyBlueHeader.copy(alpha = 0.3f)),
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (userAvatarUrl.isNotBlank()) {
                                AsyncImage(
                                    model = userAvatarUrl,
                                    contentDescription = "Foto Profil",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else {
                                Text(
                                    text = userName.take(1).uppercase(),
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = SkyBlueHeader,
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
}
