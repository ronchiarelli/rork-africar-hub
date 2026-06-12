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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.UserRole
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun DashboardScreen(navController: NavController, appViewModel: AppViewModel) {
    val state by appViewModel.state.collectAsState()

    when (state.role) {
        UserRole.FLEET_OWNER -> com.rork.autorideghana.ui.screens.dashboards.FleetDashboardScreen(navController, embedded = true)
        UserRole.DEALERSHIP -> com.rork.autorideghana.ui.screens.dashboards.DealerDashboardScreen(navController, embedded = true)
        UserRole.ADMIN -> com.rork.autorideghana.ui.screens.dashboards.AdminDashboardScreen(navController, embedded = true)
        UserRole.CUSTOMER -> CustomerDashboard(navController)
    }
}

@Composable
private fun CustomerDashboard(navController: NavController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.PurpleDeep)
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        Spacer(Modifier.height(8.dp))
        Text("Dashboard", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(16.dp))

        // Welcome card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(Brush.horizontalGradient(listOf(AppColors.PurpleLight, AppColors.PurpleMedium)))
                .padding(22.dp)
        ) {
            Column {
                Text("Welcome back, Kwaku!", color = AppColors.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("You have 1 active booking and 2 trips coming up.", color = AppColors.PurpleFaint, fontSize = 13.sp)
            }
        }

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("12", "Total Trips", AppColors.OrangePrimary, Modifier.weight(1f))
            StatCard("3", "Active", AppColors.Success, Modifier.weight(1f))
            StatCard("4.8", "Avg Rating", AppColors.Star, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
        Text("Quick Actions", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))

        val actions = listOf(
            QuickAction("My Bookings", Icons.Filled.CalendarMonth, Routes.WALLET) { },
            QuickAction("Favorites", Icons.Filled.Favorite, Routes.FAVORITES) { navController.navigate(Routes.FAVORITES) },
            QuickAction("Wallet", Icons.Filled.AccountBalanceWallet, Routes.WALLET) { navController.navigate(Routes.WALLET) },
            QuickAction("Marketplace", Icons.Filled.Storefront, Routes.MARKETPLACE) { navController.navigate(Routes.MARKETPLACE) },
            QuickAction("KYC", Icons.Filled.Shield, Routes.KYC) { navController.navigate(Routes.KYC) },
            QuickAction("Help", Icons.AutoMirrored.Filled.HelpOutline, Routes.HELP) { navController.navigate(Routes.HELP) },
        )
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier.height(220.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            userScrollEnabled = false,
        ) {
            items(actions) { action ->
                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(AppColors.PurpleDark)
                        .clickable(onClick = action.onClick)
                        .padding(vertical = 18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier.size(44.dp).clip(CircleShape).background(AppColors.OrangePrimary.copy(alpha = 0.18f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(action.icon, action.label, tint = AppColors.OrangeBright, modifier = Modifier.size(22.dp))
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(action.label, color = AppColors.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(AppColors.OrangeFaint)
                .padding(18.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("💡", fontSize = 24.sp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Pro Tip", color = AppColors.Gray900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Book weekly to save up to 30% on long rentals.", color = AppColors.Gray700, fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(40.dp))
    }
}

private data class QuickAction(val label: String, val icon: ImageVector, val route: String, val onClick: () -> Unit)

@Composable
fun StatCard(value: String, label: String, accent: Color, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(AppColors.PurpleDark)
            .padding(vertical = 18.dp, horizontal = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(value, color = accent, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(4.dp))
        Text(label, color = AppColors.PurpleMuted, fontSize = 11.sp)
    }
}
