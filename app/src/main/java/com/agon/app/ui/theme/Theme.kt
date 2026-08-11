package com.agon.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
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
    primary = Color(0xFF38BDF8),
    onPrimary = Color(0xFF0C4A6E),
    primaryContainer = Color(0xFF0369A1),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFFFACC15),
    onSecondary = Color(0xFF422006),
    secondaryContainer = Color(0xFF713F12),
    onSecondaryContainer = Color(0xFFFEF08A),
    tertiary = Color(0xFFFDE047),
    onTertiary = Color(0xFF422006),
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = YellowBorderLis,
    outlineVariant = Color(0xFF475569)
)

@Composable
fun AgonAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content,
    )
}
