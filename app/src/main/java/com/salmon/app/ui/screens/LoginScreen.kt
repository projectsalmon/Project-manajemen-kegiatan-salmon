package com.salmon.app.ui.screens

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.common.api.ApiException
import com.salmon.app.R
import com.salmon.app.data.models.UserProfile
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

@Composable
fun LoginScreen(
    viewModel: AppViewModel,
    onLoginSuccess: (UserProfile) -> Unit
) {
    val context = LocalContext.current
    val webClientId = "957812902323-sla7uv6hfrh0te1b3vre9jdu5nga452g.apps.googleusercontent.com"

    // Launcher Google Play Services Auth
    val googleSignInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val data = result.data
        if (data != null) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            try {
                val account = task.getResult(ApiException::class.java)
                if (account != null && !account.email.isNullOrEmpty()) {
                    viewModel.handleGoogleAccountResult(account, onLoginSuccess)
                } else {
                    viewModel.setAuthError("Proses masuk dibatalkan. Silakan pilih akun Google Anda untuk melanjutkan ke layanan.")
                }
            } catch (e: Exception) {
                // Check if cancelled (e.g. status code 12501)
                if (e is ApiException && (e.statusCode == 12501 || e.statusCode == 16)) {
                    viewModel.setAuthError("Proses masuk dibatalkan. Silakan pilih akun Google Anda untuk melanjutkan ke layanan.")
                } else {
                    viewModel.setAuthError("Gagal menghubungkan ke layanan Google (${e.localizedMessage ?: "Koneksi terputus"}). Pastikan perangkat terhubung ke internet dan coba kembali.")
                }
            }
        } else {
            viewModel.setAuthError("Proses masuk dibatalkan. Silakan pilih akun Google Anda untuk melanjutkan ke layanan.")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        SkyBlueBackground,
                        Color(0xFFE8F4FD),
                        Color.White
                    )
                )
            )
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        // Official Konek App Brand Logo
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.Transparent,
            modifier = Modifier.size(115.dp),
            shadowElevation = 6.dp
        ) {
            Image(
                painter = painterResource(id = R.drawable.app_logo),
                contentDescription = "Logo Konek",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(24.dp))
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = "KONEK",
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Black,
                fontSize = 32.sp,
                letterSpacing = 1.sp
            ),
            color = Color(0xFF1D4ED8)
        )

        Text(
            text = "HUBUNGKAN DUNIAMU",
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.5.sp
            ),
            color = TextNavyMuted
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Portal Manajemen Kegiatan & Partisipasi Warga",
            style = MaterialTheme.typography.bodyMedium,
            color = TextNavySecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(36.dp))

        // Google Sign-In Card (Primary Authentication)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Masuk ke Akun Anda",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextNavyDark,
                        fontSize = 18.sp
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Silakan masuk menggunakan akun Google Anda yang terdaftar untuk mengakses seluruh layanan kegiatan warga dan staf kelurahan.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextNavySecondary,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Error Message Notice
                if (viewModel.authErrorMessage != null) {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFFFEF2F2),
                        border = BorderStroke(1.dp, Color(0xFFFECACA)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 20.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = UrgentRed,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = viewModel.authErrorMessage ?: "",
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                color = UrgentRed,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Main Google Sign-In Button (Official Clean Layout)
                Button(
                    onClick = {
                        val activity = context as? Activity
                        if (activity != null) {
                            viewModel.clearAuthError()
                            try {
                                val client = viewModel.authManager.getGoogleSignInClient(activity, webClientId)
                                client.signOut().addOnCompleteListener {
                                    googleSignInLauncher.launch(client.signInIntent)
                                }
                            } catch (e: Exception) {
                                viewModel.signInWithGoogle(
                                    activityContext = activity,
                                    serverClientId = webClientId,
                                    onSuccess = onLoginSuccess
                                )
                            }
                        }
                    },
                    enabled = !viewModel.isAuthLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = TextNavyDark
                    ),
                    border = BorderStroke(1.5.dp, Color(0xFFDADCE0)),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp, pressedElevation = 4.dp)
                ) {
                    if (viewModel.isAuthLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.5.dp,
                            color = SkyBlueHeader
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Menghubungkan Akun Google...",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = TextNavySecondary
                        )
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            // Google "G" Emblem
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF4285F4),
                                modifier = Modifier.size(24.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "G",
                                        fontWeight = FontWeight.Black,
                                        color = Color.White,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Masuk dengan Google",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                ),
                                color = TextNavyDark
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(36.dp))

        // Security Footer Note
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = null,
                tint = TextNavyMuted,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "Autentikasi Terenkripsi • Google Identity Services & Cloud Firestore",
                style = MaterialTheme.typography.labelSmall,
                color = TextNavyMuted,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
