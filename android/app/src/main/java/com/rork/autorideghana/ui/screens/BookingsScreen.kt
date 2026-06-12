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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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
import com.rork.autorideghana.data.Booking
import com.rork.autorideghana.data.BookingStatus
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun BookingsScreen(navController: NavController) {
    val tabs = listOf("All", "Active", "Upcoming", "Completed")
    var selected by remember { mutableIntStateOf(0) }

    val filtered = when (selected) {
        1 -> MockData.bookings.filter { it.status == BookingStatus.ACTIVE || it.status == BookingStatus.APPROVED }
        2 -> MockData.bookings.filter { it.status == BookingStatus.PENDING }
        3 -> MockData.bookings.filter { it.status == BookingStatus.COMPLETED }
        else -> MockData.bookings
    }

    Column(modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep)) {
        Spacer(Modifier.height(20.dp))
        Text("My Bookings", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(16.dp))
        Row(modifier = Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            tabs.forEachIndexed { index, tab ->
                val isSel = selected == index
                Text(
                    tab,
                    color = if (isSel) AppColors.White else AppColors.PurpleMuted,
                    fontSize = 13.sp,
                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSel) AppColors.OrangePrimary else AppColors.PurpleDark)
                        .clickable { selected = index }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            items(filtered) { booking ->
                BookingCard(booking) { navController.navigate(Routes.bookingDetail(booking.id)) }
            }
        }
    }
}

@Composable
fun BookingCard(booking: Booking, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(AppColors.White)
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row {
            Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.Gray100)) {
                AsyncImage(model = booking.car.image, contentDescription = booking.car.model, contentScale = ContentScale.Crop, modifier = Modifier.size(80.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row {
                    Text("${booking.car.brand} ${booking.car.model}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColors.Gray900, modifier = Modifier.weight(1f))
                    StatusPill(booking.status)
                }
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.CalendarMonth, null, tint = AppColors.Gray500, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("${booking.pickupDate} → ${booking.returnDate}", fontSize = 12.sp, color = AppColors.Gray600)
                }
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, tint = AppColors.Gray500, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(booking.pickupLocation, fontSize = 12.sp, color = AppColors.Gray600)
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("${booking.totalDays} days", fontSize = 12.sp, color = AppColors.Gray500)
            Text(formatCedis(booking.totalPrice), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = AppColors.OrangePrimary)
        }
    }
}

@Composable
fun StatusPill(status: BookingStatus) {
    val (label, bg, fg) = when (status) {
        BookingStatus.PENDING -> Triple("Pending", AppColors.Warning.copy(alpha = 0.15f), AppColors.Warning)
        BookingStatus.APPROVED -> Triple("Approved", AppColors.Info.copy(alpha = 0.15f), AppColors.Info)
        BookingStatus.ACTIVE -> Triple("Active", AppColors.Success.copy(alpha = 0.15f), AppColors.Success)
        BookingStatus.COMPLETED -> Triple("Completed", AppColors.Gray200, AppColors.Gray700)
        BookingStatus.CANCELLED -> Triple("Cancelled", AppColors.Error.copy(alpha = 0.15f), AppColors.Error)
    }
    Pill(label, bg as Color, fg as Color)
}
