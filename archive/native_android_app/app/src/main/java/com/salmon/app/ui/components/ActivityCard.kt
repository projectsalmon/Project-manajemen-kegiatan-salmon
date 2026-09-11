package com.salmon.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import com.salmon.app.data.models.ActivityItem
import com.salmon.app.data.models.ApprovalStatus
import com.salmon.app.data.models.RsvpStatus
import com.salmon.app.ui.theme.*
import com.salmon.app.utils.ShareUtils

@Composable
fun ActivityCard(
    activity: ActivityItem,
    onCardClick: () -> Unit,
    onRsvpClick: (RsvpStatus) -> Unit,
    onEditClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clickable { onCardClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        border = BorderStroke(1.5.dp, YellowBorderLis),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            
            // 1. TOP-ALIGNED IMAGE BANNER (Gambar Utama Paling Atas)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                    .background(SkyBlueSurfaceVariant)
            ) {
                if (!activity.imageUrl.isNull_or_empty()) {
                    AsyncImage(
                        model = activity.imageUrl,
                        contentDescription = activity.title,
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
                                imageVector = Icons.Default.Event,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = activity.category.displayName,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                    }
                }

                // Approval Status Overlay Badge (If not published)
                if (activity.approvalStatus != ApprovalStatus.PUBLISHED) {
                    Surface(
                        modifier = Modifier
                            .padding(10.dp)
                            .align(Alignment.TopStart),
                        shape = RoundedCornerShape(8.dp),
                        color = activity.approvalStatus.containerColor,
                        border = BorderStroke(1.dp, activity.approvalStatus.badgeColor)
                    ) {
                        Text(
                            text = activity.approvalStatus.label,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = activity.approvalStatus.badgeColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // Native Share Button on Top Banner
                IconButton(
                    onClick = {
                        val shareDetails = "📅 ${activity.formattedDate} • ${activity.timeSlot}\n📍 ${activity.locationName}\n📌 Sasaran: ${activity.targetRegion}\n\n${activity.description}"
                        ShareUtils.shareContent(context, activity.title, shareDetails)
                    },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(36.dp)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = "Bagikan Kegiatan",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // 2. CARD CONTENT DETAILS BELOW TOP IMAGE
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Category Tag & Region Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = activity.category.containerColor,
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Text(
                            text = activity.category.displayName,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = activity.category.badgeColor,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            maxLines = 1,
                            softWrap = false
                        )
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
                                    contentDescription = "Edit Kegiatan",
                                    tint = SkyBlueHeader,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = SkyBlueSurfaceVariant
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Place,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = SkyBlueHeader
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = activity.targetRegion,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = SkyBlueHeader,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Title
                Text(
                    text = activity.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    ),
                    color = TextNavyDark,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Date & Time
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Outlined.Event,
                        contentDescription = null,
                        tint = SkyBlueHeader,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${activity.formattedDate} • ${activity.timeSlot}",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                        color = TextNavySecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Location Address
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Outlined.LocationOn,
                        contentDescription = null,
                        tint = TextNavyMuted,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = activity.locationName,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextNavyMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                if (activity.needsFollowUp && activity.followUpNote != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = UrgentRedContainer
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.PendingActions,
                                contentDescription = null,
                                tint = UrgentRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = activity.followUpNote,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                color = UrgentRed,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Divider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = SkyBlueSurfaceVariant
                )

                // Bottom Footer: Confirmed count & RSVP Quick Action
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Confirmed Attendees Counter
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Group,
                            contentDescription = null,
                            tint = SkyBlueHeader,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${activity.confirmedCount} Hadir",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextNavyDark,
                            maxLines = 1,
                            softWrap = false
                        )
                        if (activity.quota != null) {
                            Text(
                                text = " / ${activity.quota} Kuota",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextNavyMuted,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // RSVP Action Button
                    when (activity.userRsvpStatus) {
                        RsvpStatus.NONE -> {
                            Button(
                                onClick = { onRsvpClick(RsvpStatus.ATTENDING) },
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = YellowHighlight,
                                    contentColor = OnYellowContainer
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "RSVP Hadir",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                        else -> {
                            Surface(
                                onClick = { onRsvpClick(RsvpStatus.NONE) },
                                shape = RoundedCornerShape(20.dp),
                                color = activity.userRsvpStatus.color.copy(alpha = 0.15f),
                                border = BorderStroke(1.dp, activity.userRsvpStatus.color)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = if (activity.userRsvpStatus == RsvpStatus.ATTENDING) Icons.Default.CheckCircle else Icons.Default.Info,
                                        contentDescription = null,
                                        tint = activity.userRsvpStatus.color,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = activity.userRsvpStatus.label,
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                        color = activity.userRsvpStatus.color,
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
}

private fun String?.isNull_or_empty(): Boolean = this.isNullOrEmpty()
