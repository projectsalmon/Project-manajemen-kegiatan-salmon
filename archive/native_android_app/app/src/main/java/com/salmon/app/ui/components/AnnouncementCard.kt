package com.salmon.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.salmon.app.data.models.AnnouncementItem
import com.salmon.app.data.models.ApprovalStatus
import com.salmon.app.ui.theme.*
import com.salmon.app.utils.ShareUtils

@Composable
fun AnnouncementCard(
    announcement: AnnouncementItem,
    onClick: () -> Unit,
    onEditClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        border = if (announcement.isPinned) BorderStroke(1.5.dp, YellowBorderLis) else BorderStroke(1.dp, SkyBlueSurfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            
            // 1. TOP-ALIGNED IMAGE BANNER (Gambar Utama Paling Atas)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                    .background(SkyBlueSurfaceVariant)
            ) {
                if (!announcement.imageUrl.isNullOrEmpty()) {
                    AsyncImage(
                        model = announcement.imageUrl,
                        contentDescription = announcement.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    // Fallback Visual Graphic Banner
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(SkyBlueHeader),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.85f),
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "PENGUMUMAN RESMI",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                    }
                }

                // Approval Status Overlay Badge (If not published)
                if (announcement.approvalStatus != ApprovalStatus.PUBLISHED) {
                    Surface(
                        modifier = Modifier
                            .padding(10.dp)
                            .align(Alignment.TopStart),
                        shape = RoundedCornerShape(8.dp),
                        color = announcement.approvalStatus.containerColor,
                        border = BorderStroke(1.dp, announcement.approvalStatus.badgeColor)
                    ) {
                        Text(
                            text = announcement.approvalStatus.label,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = announcement.approvalStatus.badgeColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // Native Share Button on Top Banner
                IconButton(
                    onClick = {
                        val reqText = if (announcement.requirements.isNotEmpty()) "\n📋 Persyaratan: ${announcement.requirements.joinToString(", ")}" else ""
                        val shareDetails = "📢 Pengumuman: ${announcement.targetRegion}\n📅 ${announcement.formattedDate}\n\n${announcement.content}$reqText"
                        ShareUtils.shareContent(context, announcement.title, shareDetails)
                    },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(36.dp)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = "Bagikan Pengumuman",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // 2. CARD CONTENT DETAILS
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = announcement.urgency.containerColor
                        ) {
                            Text(
                                text = announcement.urgency.label,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = announcement.urgency.badgeColor,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                maxLines = 1,
                                softWrap = false
                            )
                        }

                        if (announcement.isPinned) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.PushPin,
                                    contentDescription = "Sematkan",
                                    tint = YellowAccent,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(2.dp))
                                Text(
                                    text = "Disematkan",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = YellowAccent,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (onEditClick != null) {
                            IconButton(
                                onClick = onEditClick,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "Edit Pengumuman",
                                    tint = SkyBlueHeader,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                        }

                        Text(
                            text = announcement.formattedDate,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextNavyMuted,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = announcement.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    ),
                    color = TextNavyDark
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = announcement.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextNavySecondary,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )

                // Requirement Badges / Chips
                if (announcement.requirements.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        items(announcement.requirements) { req ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = YellowContainer,
                                border = BorderStroke(1.dp, YellowBorderLis)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Assignment,
                                        contentDescription = null,
                                        tint = OnYellowContainer,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = req,
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = OnYellowContainer,
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Oleh: ${announcement.authorName} (${announcement.authorRole})",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextNavyMuted,
                        modifier = Modifier.weight(1f, fill = false),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "Lihat Selengkapnya →",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = SkyBlueHeader,
                        maxLines = 1,
                        softWrap = false
                    )
                }
            }
        }
    }
}
