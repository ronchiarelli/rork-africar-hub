package com.rork.autorideghana.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = AppColors.OrangePrimary,
    onPrimary = AppColors.White,
    secondary = AppColors.PurpleMedium,
    onSecondary = AppColors.White,
    background = AppColors.Gray50,
    onBackground = AppColors.Gray900,
    surface = AppColors.White,
    onSurface = AppColors.Gray900,
    error = AppColors.Error,
)

private val DarkColorScheme = darkColorScheme(
    primary = AppColors.OrangePrimary,
    onPrimary = AppColors.White,
    secondary = AppColors.PurpleSoft,
    onSecondary = AppColors.White,
    background = AppColors.PurpleDeep,
    onBackground = AppColors.White,
    surface = AppColors.PurpleDark,
    onSurface = AppColors.White,
    error = AppColors.Error,
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // App uses fixed branded palette per-screen; use light scheme as the base.
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = AppTypography,
        content = content
    )
}
