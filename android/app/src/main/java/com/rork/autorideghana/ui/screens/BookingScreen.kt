package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(navController: NavController, carId: String?) {
    val car = MockData.carById(carId)
    var days by remember { mutableIntStateOf(3) }
    var location by remember { mutableStateOf(MockData.locations.first()) }

    val rental = car.pricePerDay * days
    val serviceFee = (rental * 0.05).toInt()
    val insurance = 50 * days
    val total = rental + serviceFee + insurance

    Scaffold(
        containerColor = AppColors.Gray50,
        topBar = {
            TopAppBar(
                title = { Text("Book Your Trip", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.White)
            )
        },
        bottomBar = {
            Column(modifier = Modifier.background(AppColors.White).padding(20.dp)) {
                Button(
                    onClick = { navController.navigate(Routes.payment(car.id)) },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
                ) {
                    Text("Proceed to Payment · ${formatCedis(total)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            // Car summary
            Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(12.dp)) {
                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.Gray100)) {
                    AsyncImage(model = car.image, contentDescription = car.model, contentScale = ContentScale.Crop, modifier = Modifier.size(80.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("${car.brand} ${car.model}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                    Text(car.location, fontSize = 13.sp, color = AppColors.Gray500)
                    Spacer(Modifier.height(4.dp))
                    Text("${formatCedis(car.pricePerDay)} /day", fontWeight = FontWeight.Bold, color = AppColors.OrangePrimary)
                }
            }

            Spacer(Modifier.height(24.dp))
            Text("Rental Duration", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StepperBtn(Icons.Filled.Remove) { if (days > 1) days-- }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$days", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.Gray900)
                    Text(if (days == 1) "day" else "days", fontSize = 13.sp, color = AppColors.Gray500)
                }
                StepperBtn(Icons.Filled.Add) { days++ }
            }

            Spacer(Modifier.height(24.dp))
            Text("Pickup Location", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(MockData.locations) { loc ->
                    val isSel = loc == location
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSel) AppColors.OrangePrimary else AppColors.White)
                            .clickable { location = loc }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.LocationOn, null, tint = if (isSel) AppColors.White else AppColors.Gray500, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(loc, color = if (isSel) AppColors.White else AppColors.Gray700, fontSize = 13.sp, fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
            Text("Price Breakdown", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp)) {
                PriceRow("${formatCedis(car.pricePerDay)} × $days days", formatCedis(rental))
                PriceRow("Service fee (5%)", formatCedis(serviceFee))
                PriceRow("Insurance", formatCedis(insurance))
                Spacer(Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AppColors.Gray200))
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                    Text(formatCedis(total), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColors.OrangePrimary)
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun StepperBtn(icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Box(
        modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.OrangeFaint).clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = AppColors.OrangePrimary, modifier = Modifier.size(22.dp))
    }
}

@Composable
fun PriceRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 14.sp, color = AppColors.Gray600)
        Text(value, fontSize = 14.sp, color = AppColors.Gray900, fontWeight = FontWeight.Medium)
    }
}
