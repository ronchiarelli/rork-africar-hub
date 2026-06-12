package com.rork.autorideghana.ui.screens.dashboards

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.FleetStatus
import com.rork.autorideghana.data.FleetVehicle
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.screens.StatCard
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FleetDashboardScreen(navController: NavController, embedded: Boolean = false) {
    if (embedded) {
        FleetContent()
    } else {
        Scaffold(
            containerColor = AppColors.PurpleDeep,
            topBar = {
                TopAppBar(
                    title = { Text("Fleet Dashboard", fontWeight = FontWeight.Bold, color = AppColors.White) },
                    navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
                )
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) { FleetContent() }
        }
    }
}

@Composable
private fun FleetContent() {
    val earnings = MockData.earnings
    Column(modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep).verticalScroll(rememberScrollState()).padding(20.dp)) {
        Spacer(Modifier.height(8.dp))
        Text("Fleet Owner", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("Manage your vehicles and earnings", color = AppColors.PurpleMuted, fontSize = 14.sp)

        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(Brush.linearGradient(listOf(AppColors.OrangePrimary, AppColors.OrangeBright))).padding(22.dp)
        ) {
            Column {
                Text("Total Revenue", color = AppColors.White.copy(alpha = 0.85f), fontSize = 14.sp)
                Spacer(Modifier.height(6.dp))
                Text(formatCedis(earnings.totalRevenue), color = AppColors.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(8.dp))
                Text("This month: ${formatCedis(earnings.thisMonth)}", color = AppColors.White.copy(alpha = 0.9f), fontSize = 13.sp)
            }
        }

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("${earnings.completedTrips}", "Trips", AppColors.OrangePrimary, Modifier.weight(1f))
            StatCard("${earnings.activeRentals}", "Active", AppColors.Success, Modifier.weight(1f))
            StatCard(formatCedis(earnings.pendingPayouts), "Pending", AppColors.Star, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
        Text("My Fleet", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        MockData.fleetVehicles.forEach { v ->
            FleetVehicleCard(v)
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun FleetVehicleCard(v: FleetVehicle) {
    Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(AppColors.PurpleDark).padding(14.dp)) {
        Row {
            Box(modifier = Modifier.size(70.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.Gray100)) {
                AsyncImage(model = v.car.image, contentDescription = v.car.model, contentScale = ContentScale.Crop, modifier = Modifier.size(70.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.Top) {
                    Text("${v.car.brand} ${v.car.model}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColors.White, modifier = Modifier.weight(1f))
                    FleetStatusPill(v.status)
                }
                Spacer(Modifier.height(6.dp))
                Text("${v.totalTrips} trips · ${formatCedis(v.totalEarnings)}", fontSize = 12.sp, color = AppColors.PurpleMuted)
            }
        }
        if (v.status == FleetStatus.MAINTENANCE) {
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(AppColors.Warning.copy(alpha = 0.15f)).padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Build, null, tint = AppColors.Warning, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(8.dp))
                Text("Maintenance due ${v.nextMaintenance}", color = AppColors.Warning, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun FleetStatusPill(status: FleetStatus) {
    val (label, color) = when (status) {
        FleetStatus.ACTIVE -> "Active" to AppColors.Success
        FleetStatus.RENTED -> "Rented" to AppColors.Info
        FleetStatus.MAINTENANCE -> "Maintenance" to AppColors.Warning
        FleetStatus.INACTIVE -> "Inactive" to AppColors.Gray500
    }
    Pill(label, (color as Color).copy(alpha = 0.2f), color)
}
