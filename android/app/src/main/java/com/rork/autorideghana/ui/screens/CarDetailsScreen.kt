package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.EventSeat
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun CarDetailsScreen(navController: NavController, appViewModel: AppViewModel, carId: String?) {
    val car = MockData.carById(carId)
    val state by appViewModel.state.collectAsState()
    val isFav = state.favoriteIds.contains(car.id)
    val pagerState = rememberPagerState(pageCount = { car.images.size })

    Box(modifier = Modifier.fillMaxSize().background(AppColors.Gray50)) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 100.dp)) {
            // Image gallery
            Box {
                HorizontalPager(state = pagerState, modifier = Modifier.fillMaxWidth().height(300.dp)) { page ->
                    Box(modifier = Modifier.fillMaxSize().background(AppColors.Gray200)) {
                        AsyncImage(model = car.images[page], contentDescription = car.model, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    }
                }
                Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp, start = 12.dp, end = 12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    CircleBtn(Icons.AutoMirrored.Filled.ArrowBack) { navController.popBackStack() }
                    CircleBtn(if (isFav) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder, if (isFav) AppColors.OrangePrimary else AppColors.Gray700) { appViewModel.toggleFavorite(car.id) }
                }
                if (car.images.size > 1) {
                    Row(modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 14.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        for (i in car.images.indices) {
                            Box(modifier = Modifier.size(if (i == pagerState.currentPage) 22.dp else 8.dp, 8.dp).clip(CircleShape).background(if (i == pagerState.currentPage) AppColors.OrangePrimary else AppColors.White.copy(alpha = 0.6f)))
                        }
                    }
                }
            }

            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("${car.brand} ${car.model}", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.Gray900)
                        Text("${car.year} · ${car.category}", fontSize = 14.sp, color = AppColors.Gray500)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Star, null, tint = AppColors.Star, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("${car.rating}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColors.Gray900)
                        }
                        Text("${car.reviewCount} reviews", fontSize = 12.sp, color = AppColors.Gray500)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, tint = AppColors.OrangePrimary, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(car.location, fontSize = 14.sp, color = AppColors.Gray700)
                }

                Spacer(Modifier.height(20.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.height(180.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    userScrollEnabled = false,
                ) {
                    val specs = listOf(
                        Triple(Icons.Filled.EventSeat, "${car.seats} Seats", "Capacity"),
                        Triple(Icons.Filled.Settings, car.transmission, "Transmission"),
                        Triple(Icons.Filled.LocalGasStation, car.fuelType, "Fuel"),
                        Triple(Icons.Filled.Speed, "${car.horsepower} HP", "Power"),
                    )
                    items(specs) { spec ->
                        SpecCard(spec.first, spec.second, spec.third)
                    }
                }

                Spacer(Modifier.height(20.dp))
                Text("Description", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = AppColors.Gray900)
                Spacer(Modifier.height(8.dp))
                Text(car.description, fontSize = 14.sp, color = AppColors.Gray600, lineHeight = 21.sp)

                Spacer(Modifier.height(20.dp))
                Text("Features", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = AppColors.Gray900)
                Spacer(Modifier.height(10.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    car.features.forEach { f ->
                        Pill(f, AppColors.PurpleFaint, AppColors.PurpleMedium)
                    }
                }

                Spacer(Modifier.height(20.dp))
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
                        Text("Verified Owner", fontSize = 12.sp, color = AppColors.Success)
                    }
                    CircleBtn(Icons.Filled.Chat, AppColors.Success) {}
                    Spacer(Modifier.width(8.dp))
                    CircleBtn(Icons.Filled.Call, AppColors.Info) {}
                }
            }
        }

        // Bottom bar
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(AppColors.White)
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text("Price per day", fontSize = 12.sp, color = AppColors.Gray500)
                Text(formatCedis(car.pricePerDay), fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = AppColors.OrangePrimary)
            }
            Button(
                onClick = { navController.navigate(Routes.booking(car.id)) },
                enabled = car.isAvailable,
                modifier = Modifier.height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary, disabledContainerColor = AppColors.Gray300),
            ) {
                Text(if (car.isAvailable) "Rent Now" else "Unavailable", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White, modifier = Modifier.padding(horizontal = 16.dp))
            }
        }
    }
}

@Composable
private fun SpecCard(icon: ImageVector, value: String, label: String) {
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.OrangeFaint), contentAlignment = Alignment.Center) {
            Icon(icon, label, tint = AppColors.OrangePrimary, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text(value, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.Gray900)
            Text(label, fontSize = 11.sp, color = AppColors.Gray500)
        }
    }
}

@Composable
fun CircleBtn(icon: ImageVector, tint: androidx.compose.ui.graphics.Color = AppColors.Gray700, onClick: () -> Unit) {
    Box(
        modifier = Modifier.size(42.dp).clip(CircleShape).background(AppColors.White).clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
    }
}
