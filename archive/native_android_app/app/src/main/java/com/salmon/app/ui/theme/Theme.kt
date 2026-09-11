package com.salmon.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextFieldColors
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = SkyBlueHeader,
    onPrimary = Color.White,
    primaryContainer = SkyBlueSurfaceVariant,
    onPrimaryContainer = TextNavyDark,
    secondary = YellowHighlight,
    onSecondary = OnYellowContainer,
    secondaryContainer = YellowContainer,
    onSecondaryContainer = OnYellowContainer,
    tertiary = YellowAccent,
    onTertiary = Color.White,
    tertiaryContainer = YellowContainer,
    onTertiaryContainer = OnYellowContainer,
    background = SkyBlueBackground,
    onBackground = TextNavyDark,
    surface = SkyBlueSurface,
    onSurface = TextNavyDark,
    surfaceVariant = SkyBlueSurfaceVariant,
    onSurfaceVariant = TextNavySecondary,
    outline = YellowBorderLis,
    outlineVariant = Color(0xFFCBD5E1)
)

private val DarkColorScheme = darkColorScheme(
    primary = SkyBlueHeader,
    onPrimary = Color.White,
    primaryContainer = SkyBlueSurfaceVariant,
    onPrimaryContainer = TextNavyDark,
    secondary = YellowHighlight,
    onSecondary = OnYellowContainer,
    secondaryContainer = YellowContainer,
    onSecondaryContainer = OnYellowContainer,
    tertiary = YellowAccent,
    onTertiary = Color.White,
    background = SkyBlueBackground,
    onBackground = TextNavyDark,
    surface = Color.White,
    onSurface = TextNavyDark,
    surfaceVariant = SkyBlueSurfaceVariant,
    onSurfaceVariant = TextNavySecondary,
    outline = YellowBorderLis,
    outlineVariant = Color(0xFFCBD5E1)
)

/**
 * Standard High-Contrast, Ultra-Visible TextField Colors for Civic App.
 * Guarantees numbers, text, labels, and placeholders are 100% sharp and readable.
 */
@Composable
fun civicTextFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = TextNavyDark,
        unfocusedTextColor = TextNavyDark,
        disabledTextColor = TextNavyMuted,
        focusedContainerColor = Color.White,
        unfocusedContainerColor = Color.White,
        disabledContainerColor = Color(0xFFF1F5F9),
        cursorColor = SkyBlueHeader,
        focusedBorderColor = SkyBlueHeader,
        unfocusedBorderColor = Color(0xFFCBD5E1),
        focusedLabelColor = SkyBlueHeader,
        unfocusedLabelColor = TextNavySecondary,
        focusedPlaceholderColor = TextNavyMuted,
        unfocusedPlaceholderColor = TextNavyMuted
    )
}

@Composable
fun AgonAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    // We use a clean, sunny civic palette that guarantees high-contrast text & legible numbers
    val colorScheme = LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = CivicTypography,
        content = content,
    )
}
