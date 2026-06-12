package com.rork.autorideghana.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import com.rork.autorideghana.ui.components.PurpleGradientBackground
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun WelcomeScreen(navController: NavController) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    PurpleGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(28.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AnimatedVisibility(visible, enter = fadeIn(tween(600)) + slideInVertically(tween(600)) { it / 3 }) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(96.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(AppColors.OrangePrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.DirectionsCar, null, tint = AppColors.White, modifier = Modifier.size(52.dp))
                    }
                    Spacer(Modifier.height(28.dp))
                    Row {
                        Text("AutoRide", fontSize = 38.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.White)
                        Text(" Ghana", fontSize = 38.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.OrangeBright)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "Rent and buy premium cars across Ghana. Your journey, your way.",
                        fontSize = 16.sp,
                        color = AppColors.PurpleMuted,
                        modifier = Modifier.padding(horizontal = 12.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    )
                }
            }

            Spacer(Modifier.height(56.dp))

            AnimatedVisibility(visible, enter = fadeIn(tween(800)) + slideInVertically(tween(800)) { it / 2 }) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = { navController.navigate(Routes.REGISTER) },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
                    ) {
                        Text("Get Started", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = AppColors.White)
                    }
                    Spacer(Modifier.height(14.dp))
                    TextButton(onClick = { navController.navigate(Routes.LOGIN) }, modifier = Modifier.fillMaxWidth()) {
                        Text("I already have an account", color = AppColors.White, fontSize = 15.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}
