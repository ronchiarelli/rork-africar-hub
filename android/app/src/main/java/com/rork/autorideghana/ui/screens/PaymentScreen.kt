package com.rork.autorideghana.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(navController: NavController, carId: String?) {
    val car = MockData.carById(carId)
    var selectedMethod by remember { mutableStateOf(MockData.paymentMethods.first().id) }
    var paid by remember { mutableStateOf(false) }

    if (paid) {
        PaymentSuccess(navController)
        return
    }

    val total = car.pricePerDay * 3 + (car.pricePerDay * 3 * 0.05).toInt() + 150

    Scaffold(
        containerColor = AppColors.Gray50,
        topBar = {
            TopAppBar(
                title = { Text("Payment", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.White)
            )
        },
        bottomBar = {
            Column(modifier = Modifier.background(AppColors.White).padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 10.dp)) {
                    Icon(Icons.Filled.Lock, null, tint = AppColors.Success, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Payments are secure and encrypted", fontSize = 12.sp, color = AppColors.Gray500)
                }
                Button(
                    onClick = { paid = true },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
                ) {
                    Text("Pay ${formatCedis(total)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            Text("Order Summary", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp)) {
                PriceRow("${car.brand} ${car.model} (3 days)", formatCedis(car.pricePerDay * 3))
                PriceRow("Service fee", formatCedis((car.pricePerDay * 3 * 0.05).toInt()))
                PriceRow("Insurance", formatCedis(150))
                Spacer(Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AppColors.Gray200))
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                    Text(formatCedis(total), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColors.OrangePrimary)
                }
            }

            Spacer(Modifier.height(24.dp))
            Text("Payment Method", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MockData.paymentMethods.forEach { method ->
                    val isSel = selectedMethod == method.id
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(AppColors.White)
                            .border(if (isSel) 2.dp else 0.dp, if (isSel) AppColors.OrangePrimary else Color.Transparent, RoundedCornerShape(16.dp))
                            .clickable { selectedMethod = method.id }
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(method.icon, fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(method.label, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = AppColors.Gray900)
                            if (method.details != null) Text(method.details, fontSize = 12.sp, color = AppColors.Gray500)
                        }
                        Box(
                            modifier = Modifier.size(22.dp).clip(CircleShape).background(if (isSel) AppColors.OrangePrimary else AppColors.Gray200),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isSel) Icon(Icons.Filled.Check, null, tint = AppColors.White, modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun PaymentSuccess(navController: NavController) {
    var visible by remember { mutableStateOf(false) }
    androidx.compose.runtime.LaunchedEffect(Unit) { visible = true }

    Column(
        modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep).padding(28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AnimatedVisibility(visible, enter = scaleIn(tween(500)) + fadeIn(tween(500))) {
            Box(modifier = Modifier.size(110.dp).clip(CircleShape).background(AppColors.Success), contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.CheckCircle, null, tint = AppColors.White, modifier = Modifier.size(64.dp))
            }
        }
        Spacer(Modifier.height(28.dp))
        Text("Booking Confirmed!", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(10.dp))
        Text("Your car has been booked successfully. Check My Bookings for trip details.", color = AppColors.PurpleMuted, fontSize = 15.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text("Ref: ARG-2026-8842", color = AppColors.OrangeBright, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(40.dp))
        Button(
            onClick = { navController.navigate(Routes.MAIN) { popUpTo(Routes.MAIN) { inclusive = true } } },
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
        ) {
            Text("Back to Home", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = { navController.popBackStack(Routes.MAIN, false) },
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(16.dp),
        ) {
            Text("View My Bookings", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
        }
    }
}
