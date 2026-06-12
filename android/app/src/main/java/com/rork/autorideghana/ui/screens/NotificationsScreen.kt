package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.AppNotification
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(navController: NavController) {
    val readIds = remember { mutableStateListOf<String>() }
    val notifications = MockData.notifications

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("Notifications", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                actions = {
                    TextButton(onClick = { notifications.forEach { if (!readIds.contains(it.id)) readIds.add(it.id) } }) {
                        Text("Mark all read", color = AppColors.OrangeBright, fontSize = 13.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp),
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(12.dp)
        ) {
            item { Spacer(Modifier.height(4.dp)) }
            items(notifications) { n ->
                val isRead = n.isRead || readIds.contains(n.id)
                NotificationCard(n, isRead) { if (!readIds.contains(n.id)) readIds.add(n.id) }
            }
        }
    }
}

@Composable
private fun NotificationCard(n: AppNotification, isRead: Boolean, onClick: () -> Unit) {
    val (icon, color) = when (n.type) {
        "booking" -> Icons.Filled.CalendarMonth to AppColors.Info
        "payment" -> Icons.Filled.CreditCard to AppColors.Success
        "promo" -> Icons.Filled.Campaign to AppColors.OrangePrimary
        "kyc" -> Icons.Filled.Shield to AppColors.PurpleSoft
        else -> Icons.Filled.Info to AppColors.Gray500
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (isRead) AppColors.PurpleDark else AppColors.PurpleMedium.copy(alpha = 0.45f))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Box(modifier = Modifier.size(42.dp).clip(CircleShape).background(color.copy(alpha = 0.18f)), contentAlignment = Alignment.Center) {
            Icon(icon as ImageVector, null, tint = color as Color, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(n.title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.White, modifier = Modifier.weight(1f))
                if (!isRead) Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AppColors.OrangePrimary))
            }
            Spacer(Modifier.height(3.dp))
            Text(n.message, fontSize = 12.sp, color = AppColors.PurpleMuted, lineHeight = 17.sp)
            Spacer(Modifier.height(4.dp))
            Text(n.timestamp, fontSize = 11.sp, color = AppColors.PurpleLight)
        }
    }
}
