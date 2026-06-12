package com.rork.autorideghana.ui.screens.dashboards

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.AdminUser
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(navController: NavController, embedded: Boolean = false) {
    if (embedded) {
        AdminContent()
    } else {
        Scaffold(
            containerColor = AppColors.PurpleDeep,
            topBar = {
                TopAppBar(
                    title = { Text("Admin Dashboard", fontWeight = FontWeight.Bold, color = AppColors.White) },
                    navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
                )
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) { AdminContent() }
        }
    }
}

@Composable
private fun AdminContent() {
    var tab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Overview", "Users", "KYC")
    val stats = MockData.adminStats

    Column(modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep).verticalScroll(rememberScrollState()).padding(20.dp)) {
        Spacer(Modifier.height(8.dp))
        Text("Admin", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("Platform overview and management", color = AppColors.PurpleMuted, fontSize = 14.sp)

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            tabs.forEachIndexed { index, t ->
                val isSel = tab == index
                Text(
                    t,
                    color = if (isSel) AppColors.White else AppColors.PurpleMuted,
                    fontSize = 13.sp,
                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSel) AppColors.OrangePrimary else AppColors.PurpleDark)
                        .clickable { tab = index }
                        .padding(horizontal = 18.dp, vertical = 9.dp)
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        when (tab) {
            0 -> {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.height(220.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    userScrollEnabled = false,
                ) {
                    val items = listOf(
                        "${stats.totalUsers}" to "Total Users",
                        "${stats.totalBookings}" to "Bookings",
                        formatCedis(stats.totalRevenue) to "Revenue",
                        "${stats.activeListings}" to "Listings",
                    )
                    items(items) { item ->
                        Column(
                            modifier = Modifier.clip(RoundedCornerShape(18.dp)).background(AppColors.PurpleDark).padding(18.dp)
                        ) {
                            Text(item.first, color = AppColors.OrangeBright, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                            Spacer(Modifier.height(4.dp))
                            Text(item.second, color = AppColors.PurpleMuted, fontSize = 12.sp)
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
                Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(AppColors.PurpleDark).padding(18.dp)) {
                    Text("Monthly Growth", color = AppColors.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text("+${stats.monthlyGrowth}%", color = AppColors.Success, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(12.dp))
                    val bars = listOf(0.4f, 0.55f, 0.5f, 0.7f, 0.65f, 0.85f, 1f)
                    Row(modifier = Modifier.fillMaxWidth().height(80.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
                        bars.forEach { h ->
                            Box(modifier = Modifier.weight(1f).fillMaxHeight(h).clip(RoundedCornerShape(6.dp)).background(AppColors.OrangePrimary))
                        }
                    }
                }
            }
            1 -> {
                MockData.adminUsers.forEach { user ->
                    AdminUserRow(user)
                    Spacer(Modifier.height(10.dp))
                }
            }
            else -> {
                Box(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.Warning.copy(alpha = 0.15f)).padding(16.dp)
                ) {
                    Text("${stats.pendingKYC} pending KYC verifications", color = AppColors.Warning, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Spacer(Modifier.height(12.dp))
                MockData.adminUsers.filter { it.status == "pending_kyc" }.forEach { user ->
                    KycApprovalRow(user)
                    Spacer(Modifier.height(10.dp))
                }
            }
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun AdminUserRow(user: AdminUser) {
    val statusColor = when (user.status) {
        "active" -> AppColors.Success
        "suspended" -> AppColors.Error
        else -> AppColors.Warning
    }
    Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(AppColors.Gray100)) {
            AsyncImage(model = user.avatar, contentDescription = user.name, contentScale = ContentScale.Crop, modifier = Modifier.size(44.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(user.name, color = AppColors.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(user.role.label, color = AppColors.PurpleMuted, fontSize = 12.sp)
        }
        Pill(user.status.replace("_", " ").replaceFirstChar { it.uppercase() }, statusColor.copy(alpha = 0.2f), statusColor)
    }
}

@Composable
private fun KycApprovalRow(user: AdminUser) {
    Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(AppColors.Gray100)) {
            AsyncImage(model = user.avatar, contentDescription = user.name, contentScale = ContentScale.Crop, modifier = Modifier.size(44.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(user.name, color = AppColors.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text("Joined ${user.joinDate}", color = AppColors.PurpleMuted, fontSize = 12.sp)
        }
        Box(modifier = Modifier.size(38.dp).clip(CircleShape).background(AppColors.Success).clickable {}, contentAlignment = Alignment.Center) {
            Icon(Icons.Filled.Check, "Approve", tint = AppColors.White, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(8.dp))
        Box(modifier = Modifier.size(38.dp).clip(CircleShape).background(AppColors.Error).clickable {}, contentAlignment = Alignment.Center) {
            Icon(Icons.Filled.Close, "Reject", tint = AppColors.White, modifier = Modifier.size(20.dp))
        }
    }
}
