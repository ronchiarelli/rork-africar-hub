package com.rork.autorideghana.ui.screens

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tag
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
import com.rork.autorideghana.data.BookingStatus
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingDetailScreen(navController: NavController, bookingId: String?) {
    val booking = MockData.bookingById(bookingId)
    val car = booking.car

    Scaffold(
        containerColor = AppColors.Gray50,
        topBar = {
            TopAppBar(
                title = { Text("Booking Details", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.White)
            )
        },
        bottomBar = {
            if (booking.status == BookingStatus.COMPLETED) {
                Column(modifier = Modifier.background(AppColors.White).padding(20.dp)) {
                    Button(
                        onClick = { navController.navigate(Routes.review(booking.id)) },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
                    ) {
                        Icon(Icons.Filled.Star, null, tint = AppColors.White, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Rate Your Trip", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
                    }
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            // Status banner
            val (label, color) = when (booking.status) {
                BookingStatus.PENDING -> "Pending Approval" to AppColors.Warning
                BookingStatus.APPROVED -> "Booking Approved" to AppColors.Info
                BookingStatus.ACTIVE -> "Trip In Progress" to AppColors.Success
                BookingStatus.COMPLETED -> "Trip Completed" to AppColors.Gray600
                BookingStatus.CANCELLED -> "Cancelled" to AppColors.Error
            }
            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(color.copy(alpha = 0.12f)).padding(16.dp)) {
                Text(label, color = color, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            Spacer(Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(12.dp)) {
                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.Gray100)) {
                    AsyncImage(model = car.image, contentDescription = car.model, contentScale = ContentScale.Crop, modifier = Modifier.size(80.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("${car.brand} ${car.model}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                    Text("${car.year} · ${car.category}", fontSize = 13.sp, color = AppColors.Gray500)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Star, null, tint = AppColors.Star, modifier = Modifier.size(13.dp))
                        Spacer(Modifier.width(3.dp))
                        Text("${car.rating} · ${car.location}", fontSize = 12.sp, color = AppColors.Gray600)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Text("Trip Details", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
            Spacer(Modifier.height(12.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp)) {
                DetailRow(Icons.Filled.CalendarMonth, "Pickup Date", booking.pickupDate)
                DetailRow(Icons.Filled.CalendarMonth, "Return Date", booking.returnDate)
                DetailRow(Icons.Filled.LocationOn, "Location", booking.pickupLocation)
                DetailRow(Icons.Filled.Schedule, "Duration", "${booking.totalDays} days")
                DetailRow(Icons.Filled.Tag, "Reference", "ARG-${booking.id.uppercase()}-8842")
                Spacer(Modifier.height(6.dp))
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AppColors.Gray200))
                Spacer(Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Paid", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                    Text(formatCedis(booking.totalPrice), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColors.OrangePrimary)
                }
            }

            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(AppColors.PurpleFaint), contentAlignment = Alignment.Center) {
                    Text(car.ownerName.take(1), fontWeight = FontWeight.Bold, color = AppColors.PurpleMedium, fontSize = 20.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(car.ownerName, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColors.Gray900)
                    Text("Owner", fontSize = 12.sp, color = AppColors.Gray500)
                }
                CircleBtn(Icons.Filled.Chat, AppColors.Success) {}
                Spacer(Modifier.width(8.dp))
                CircleBtn(Icons.Filled.Call, AppColors.Info) {}
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun DetailRow(icon: ImageVector, label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = AppColors.OrangePrimary, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(12.dp))
        Text(label, fontSize = 14.sp, color = AppColors.Gray500, modifier = Modifier.weight(1f))
        Text(value, fontSize = 14.sp, color = AppColors.Gray900, fontWeight = FontWeight.SemiBold)
    }
}
