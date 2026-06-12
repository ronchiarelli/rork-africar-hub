package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.CarCard
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun HomeScreen(navController: NavController, appViewModel: AppViewModel) {
    val state by appViewModel.state.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep)) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(AppColors.PurpleDeep, AppColors.PurpleDark)))
                    .padding(20.dp)
                    .padding(top = 16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.LocationOn, null, tint = AppColors.OrangeBright, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Accra, Ghana", color = AppColors.PurpleMuted, fontSize = 13.sp)
                        }
                        Spacer(Modifier.height(2.dp))
                        Text("Hello, Kwaku 👋", color = AppColors.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(AppColors.PurpleMedium.copy(alpha = 0.5f))
                            .clickable { navController.navigate(Routes.NOTIFICATIONS) },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Notifications, "Notifications", tint = AppColors.White, modifier = Modifier.size(22.dp))
                    }
                }
                Spacer(Modifier.height(16.dp))
                // Search bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(AppColors.White)
                        .clickable { navController.navigate(Routes.SEARCH) }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Search, null, tint = AppColors.Gray500, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Search cars, brands, locations...", color = AppColors.Gray500, fontSize = 14.sp)
                }
            }

            Column(modifier = Modifier.padding(top = 12.dp)) {
                // Promo banner
                Box(
                    modifier = Modifier
                        .padding(horizontal = 20.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Brush.horizontalGradient(listOf(AppColors.OrangePrimary, AppColors.OrangeBright)))
                        .padding(20.dp)
                ) {
                    Column {
                        Text("20% OFF Weekend Rides", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.height(4.dp))
                        Text("Use code WEEKEND20 on any SUV booking", color = AppColors.White.copy(alpha = 0.9f), fontSize = 13.sp)
                    }
                }

                Spacer(Modifier.height(24.dp))
                SectionHeader("Top", "Brands")
                Spacer(Modifier.height(12.dp))
                LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(MockData.brands) { brand ->
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(AppColors.White)
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                AsyncImage(model = brand.logo, contentDescription = brand.name, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize())
                            }
                            Spacer(Modifier.height(6.dp))
                            Text(brand.name, color = AppColors.PurpleFaint, fontSize = 11.sp)
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))
                SectionHeader("Trending", "Cars")
                Spacer(Modifier.height(12.dp))
                LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(MockData.cars.filter { it.isAvailable }) { car ->
                        CarCard(
                            car = car,
                            isFavorite = state.favoriteIds.contains(car.id),
                            onClick = { navController.navigate(Routes.carDetails(car.id)) },
                            onToggleFavorite = { appViewModel.toggleFavorite(car.id) },
                        )
                    }
                }

                Spacer(Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SectionHeaderInline("Featured", "For Sale")
                    Spacer(Modifier.weight(1f))
                    Text("See all", color = AppColors.OrangeBright, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { navController.navigate(Routes.MARKETPLACE) })
                }
                Spacer(Modifier.height(12.dp))
                LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(MockData.saleCars) { sale ->
                        Column(
                            modifier = Modifier
                                .width(220.dp)
                                .clip(RoundedCornerShape(18.dp))
                                .background(AppColors.White)
                                .clickable { navController.navigate(Routes.MARKETPLACE) }
                        ) {
                            Box(modifier = Modifier.fillMaxWidth().height(120.dp).background(AppColors.Gray100)) {
                                AsyncImage(model = sale.image, contentDescription = sale.model, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                            }
                            Column(Modifier.padding(12.dp)) {
                                Text("${sale.brand} ${sale.model}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.Gray900)
                                Text("${sale.year} · ${sale.condition}", fontSize = 12.sp, color = AppColors.Gray500)
                                Spacer(Modifier.height(6.dp))
                                Text(formatCedis(sale.salePrice), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = AppColors.OrangePrimary)
                            }
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))
                SectionHeader("Near", "You")
                Spacer(Modifier.height(12.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    MockData.cars.take(4).forEach { car ->
                        com.rork.autorideghana.ui.components.CarListItem(
                            car = car,
                            isFavorite = state.favoriteIds.contains(car.id),
                            onClick = { navController.navigate(Routes.carDetails(car.id)) },
                            onToggleFavorite = { appViewModel.toggleFavorite(car.id) },
                        )
                    }
                }
                Spacer(Modifier.height(100.dp))
            }
        }

        // Floating Search FAB
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
                .size(58.dp)
                .clip(CircleShape)
                .background(AppColors.OrangePrimary)
                .clickable { navController.navigate(Routes.SEARCH) },
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.Search, "Search", tint = AppColors.White, modifier = Modifier.size(26.dp))
        }
    }
}

@Composable
fun SectionHeader(normal: String, accent: String) {
    Row(modifier = Modifier.padding(horizontal = 20.dp)) {
        Text("$normal ", color = AppColors.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(accent, color = AppColors.OrangeBright, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SectionHeaderInline(normal: String, accent: String) {
    Row {
        Text("$normal ", color = AppColors.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(accent, color = AppColors.OrangeBright, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}
