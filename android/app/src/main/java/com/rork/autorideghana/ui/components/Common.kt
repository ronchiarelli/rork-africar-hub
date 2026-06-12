package com.rork.autorideghana.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.autorideghana.ui.theme.AppColors

/** Full-screen deep purple vertical gradient used as a background. */
@Composable
fun PurpleGradientBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(AppColors.PurpleDeep, AppColors.PurpleDark, AppColors.PurpleMedium)
                )
            )
    ) {
        content()
    }
}

/** A small rounded pill badge. */
@Composable
fun Pill(
    text: String,
    bgColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier,
) {
    Text(
        text = text,
        color = textColor,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}

fun Modifier.clickableNoRipple(onClick: () -> Unit): Modifier = this.clickable(
    indication = null,
    interactionSource = androidx.compose.foundation.interaction.MutableInteractionSource(),
    onClick = onClick,
)

fun formatCedis(amount: Int): String {
    val s = amount.toString()
    val sb = StringBuilder()
    var count = 0
    for (i in s.length - 1 downTo 0) {
        sb.append(s[i])
        count++
        if (count % 3 == 0 && i != 0) sb.append(',')
    }
    return "GH₵ ${sb.reverse()}"
}
