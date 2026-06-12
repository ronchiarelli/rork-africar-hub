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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.data.UserRole
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun ProfileScreen(navController: NavController, appViewModel: AppViewModel) {
    val state by appViewModel.state.collectAsState()
    val user = MockData.profileForRole(state.role)
    var showRoleSheet by remember { mutableStateOf(false) }
    var showLogout by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.PurpleDeep)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Column(
            modifier = Modifier.fillMaxWidth().padding(20.dp).padding(top = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(modifier = Modifier.size(88.dp).clip(CircleShape).background(AppColors.PurpleMedium)) {
                AsyncImage(model = user.avatar, contentDescription = user.name, contentScale = ContentScale.Crop, modifier = Modifier.size(88.dp))
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(user.name, color = AppColors.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                if (user.isVerified) {
                    Spacer(Modifier.width(6.dp))
                    Icon(Icons.Filled.Verified, "Verified", tint = AppColors.Info, modifier = Modifier.size(20.dp))
                }
            }
            Text(user.email, color = AppColors.PurpleMuted, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Pill(user.role.label, AppColors.OrangePrimary, AppColors.White)
        }

        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("${user.totalBookings}", "Bookings", AppColors.OrangePrimary, Modifier.weight(1f))
            StatCard("4.9", "Rating", AppColors.Star, Modifier.weight(1f))
            StatCard("Gold", "Tier", AppColors.PurpleMuted, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            MenuRow(Icons.Filled.Favorite, "Favorites") { navController.navigate(Routes.FAVORITES) }
            MenuRow(Icons.Filled.Notifications, "Notifications") { navController.navigate(Routes.NOTIFICATIONS) }
            MenuRow(Icons.Filled.Shield, "KYC Verification") { navController.navigate(Routes.KYC) }
            MenuRow(Icons.Filled.AccountBalanceWallet, "Wallet") { navController.navigate(Routes.WALLET) }
            MenuRow(Icons.Filled.Settings, "Settings") { navController.navigate(Routes.SETTINGS) }
            MenuRow(Icons.AutoMirrored.Filled.HelpOutline, "Help & Support") { navController.navigate(Routes.HELP) }
            MenuRow(Icons.Filled.SwapHoriz, "Switch Role") { showRoleSheet = true }
        }

        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(AppColors.Error.copy(alpha = 0.12f))
                .clickable { showLogout = true }
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, "Logout", tint = AppColors.Error, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Text("Log Out", color = AppColors.Error, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        }
        Spacer(Modifier.height(40.dp))
    }

    if (showRoleSheet) {
        AlertDialog(
            onDismissRequest = { showRoleSheet = false },
            confirmButton = {},
            title = { Text("Switch Role") },
            text = {
                Column {
                    UserRole.entries.forEach { role ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    appViewModel.switchRole(role)
                                    showRoleSheet = false
                                }
                                .padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(role.label, fontSize = 16.sp, fontWeight = if (role == state.role) FontWeight.Bold else FontWeight.Normal, modifier = Modifier.weight(1f),
                                color = if (role == state.role) AppColors.OrangePrimary else AppColors.Gray900)
                            if (role == state.role) Icon(Icons.Filled.Verified, null, tint = AppColors.OrangePrimary, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        )
    }

    if (showLogout) {
        AlertDialog(
            onDismissRequest = { showLogout = false },
            confirmButton = {
                TextButton(onClick = {
                    showLogout = false
                    appViewModel.logout()
                    navController.navigate(Routes.WELCOME) { popUpTo(0) { inclusive = true } }
                }) { Text("Log Out", color = AppColors.Error) }
            },
            dismissButton = { TextButton(onClick = { showLogout = false }) { Text("Cancel") } },
            title = { Text("Log Out") },
            text = { Text("Are you sure you want to log out of your account?") }
        )
    }
}

@Composable
private fun MenuRow(icon: ImageVector, label: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.PurpleDark), contentAlignment = Alignment.Center) {
            Icon(icon, label, tint = AppColors.OrangeBright, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(14.dp))
        Text(label, color = AppColors.White, fontSize = 15.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = AppColors.PurpleMuted, modifier = Modifier.size(18.dp))
    }
}
