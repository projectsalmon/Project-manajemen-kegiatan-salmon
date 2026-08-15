package com.salmon.app.ui.dialogs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.salmon.app.ui.theme.*

@Composable
fun AppConfigDialog(
    currentAppName: String,
    currentKelurahan: String,
    currentRwScope: String,
    onSave: (appName: String, kelurahan: String, rwScope: String) -> Unit,
    onDismiss: () -> Unit
) {
    var appNameInput by remember { mutableStateOf(currentAppName) }
    var kelurahanInput by remember { mutableStateOf(currentKelurahan) }
    var rwScopeInput by remember { mutableStateOf(currentRwScope) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = SkyBlueHeader,
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.LocationCity,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Identitas Wilayah & Kelurahan",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
                        ),
                        color = TextNavyDark
                    )
                    Text(
                        text = "Pengaturan Header & Wilayah oleh Admin",
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
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Ubah nama kelurahan dan lingkup wilayah yang ditampilkan di bagian atas aplikasi untuk semua warga:",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextNavySecondary
                )

                OutlinedTextField(
                    value = appNameInput,
                    onValueChange = { appNameInput = it },
                    label = { Text("Nama Header Aplikasi *", fontWeight = FontWeight.SemiBold) },
                    placeholder = { Text("Contoh: Kegiatan Kelurahan") },
                    colors = civicTextFieldColors(),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = TextNavyDark),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )

                OutlinedTextField(
                    value = kelurahanInput,
                    onValueChange = { kelurahanInput = it },
                    label = { Text("Nama Kelurahan / Desa *", fontWeight = FontWeight.SemiBold) },
                    placeholder = { Text("Contoh: Sukamaju") },
                    colors = civicTextFieldColors(),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = TextNavyDark),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )

                OutlinedTextField(
                    value = rwScopeInput,
                    onValueChange = { rwScopeInput = it },
                    label = { Text("Lingkup RW / Wilayah *", fontWeight = FontWeight.SemiBold) },
                    placeholder = { Text("Contoh: RW 05") },
                    colors = civicTextFieldColors(),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = TextNavyDark),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (appNameInput.isNotBlank() && kelurahanInput.isNotBlank() && rwScopeInput.isNotBlank()) {
                        onSave(appNameInput.trim(), kelurahanInput.trim(), rwScopeInput.trim())
                        onDismiss()
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = YellowHighlight,
                    contentColor = OnYellowContainer
                )
            ) {
                Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Simpan Perubahan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal", color = TextNavySecondary)
            }
        },
        shape = RoundedCornerShape(24.dp),
        containerColor = Color.White
    )
}
