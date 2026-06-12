package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.PurpleGradientBackground
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors
import kotlinx.coroutines.delay

@Composable
fun OtpScreen(navController: NavController, appViewModel: AppViewModel) {
    var code by remember { mutableStateOf("") }
    var countdown by remember { mutableIntStateOf(30) }

    LaunchedEffect(countdown) {
        if (countdown > 0) {
            delay(1000)
            countdown -= 1
        }
    }

    PurpleGradientBackground {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White)
            }
            Spacer(Modifier.height(24.dp))
            Text("Verify your", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.White)
            Text("number", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.OrangeBright)
            Spacer(Modifier.height(10.dp))
            Text("We sent a 4-digit code to your phone. Enter it below.", fontSize = 15.sp, color = AppColors.PurpleMuted)
            Spacer(Modifier.height(40.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp, Alignment.CenterHorizontally)) {
                for (i in 0 until 4) {
                    val filled = i < code.length
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (filled) AppColors.OrangePrimary else AppColors.PurpleDark),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (filled) code[i].toString() else "",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.White
                        )
                    }
                }
            }
            Spacer(Modifier.height(28.dp))

            // Numeric keypad
            val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫")
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                keys.chunked(3).forEach { rowKeys ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        rowKeys.forEach { key ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(56.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(if (key.isEmpty()) AppColors.PurpleDeep else AppColors.PurpleMedium.copy(alpha = 0.4f)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (key.isNotEmpty()) {
                                    Text(
                                        key,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = AppColors.White,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickableKey {
                                                if (key == "⌫") {
                                                    if (code.isNotEmpty()) code = code.dropLast(1)
                                                } else if (code.length < 4) {
                                                    code += key
                                                }
                                            },
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    appViewModel.login()
                    navController.navigate(Routes.MAIN) { popUpTo(Routes.WELCOME) { inclusive = true } }
                },
                enabled = code.length == 4,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary, disabledContainerColor = AppColors.PurpleLight),
            ) {
                Text("Verify", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
            }
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = { if (countdown == 0) countdown = 30 }, enabled = countdown == 0, modifier = Modifier.fillMaxWidth()) {
                Text(
                    if (countdown == 0) "Resend code" else "Resend code in ${countdown}s",
                    color = if (countdown == 0) AppColors.OrangeBright else AppColors.PurpleMuted,
                    fontSize = 14.sp
                )
            }
        }
    }
}

private fun Modifier.clickableKey(onClick: () -> Unit): Modifier = this.clickable(
    indication = null,
    interactionSource = MutableInteractionSource()
) { onClick() }
