package com.rork.autorideghana.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.Car
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun CarCard(
    car: Car,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onToggleFavorite: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .width(280.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
    ) {
        Box {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(AppColors.Gray100)
            ) {
                AsyncImage(
                    model = car.image,
                    contentDescription = "${car.brand} ${car.model}",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(160.dp),
                )
            }
            Box(
                modifier = Modifier
                    .padding(12.dp)
                    .align(Alignment.TopEnd)
                    .clip(RoundedCornerShape(20.dp))
                    .background(AppColors.White)
                    .clickable(onClick = onToggleFavorite)
                    .padding(8.dp)
            ) {
                Icon(
                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (isFavorite) AppColors.OrangePrimary else AppColors.Gray500,
                    modifier = Modifier.size(20.dp)
                )
            }
            if (!car.isAvailable) {
                Pill(
                    text = "Booked",
                    bgColor = AppColors.Gray900.copy(alpha = 0.85f),
                    textColor = AppColors.White,
                    modifier = Modifier.padding(12.dp).align(Alignment.TopStart)
                )
            }
        }
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${car.brand} ${car.model}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = AppColors.Gray900,
                    modifier = Modifier.weight(1f)
                )
                Icon(Icons.Filled.Star, null, tint = AppColors.Star, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(3.dp))
                Text("${car.rating}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.Gray700)
            }
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.LocationOn, null, tint = AppColors.Gray500, modifier = Modifier.size(14.dp))
                Spacer(Modifier.width(3.dp))
                Text(car.location, fontSize = 13.sp, color = AppColors.Gray600)
                Spacer(Modifier.width(8.dp))
                Pill(car.category, AppColors.PurpleFaint, AppColors.PurpleMedium)
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(formatCedis(car.pricePerDay), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColors.OrangePrimary)
                    Text(" /day", fontSize = 12.sp, color = AppColors.Gray500, modifier = Modifier.padding(bottom = 2.dp))
                }
                Text("${car.seats} seats · ${car.transmission}", fontSize = 11.sp, color = AppColors.Gray500)
            }
        }
    }
}

@Composable
fun CarListItem(
    car: Car,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onToggleFavorite: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Row(modifier = Modifier.padding(10.dp)) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(AppColors.Gray100)
            ) {
                AsyncImage(
                    model = car.image,
                    contentDescription = "${car.brand} ${car.model}",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(96.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f).padding(vertical = 4.dp), verticalArrangement = Arrangement.SpaceBetween) {
                Row(verticalAlignment = Alignment.Top) {
                    Text(
                        text = "${car.brand} ${car.model}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = AppColors.Gray900,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = if (isFavorite) AppColors.OrangePrimary else AppColors.Gray400,
                        modifier = Modifier.size(20.dp).clickable(onClick = onToggleFavorite)
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Star, null, tint = AppColors.Star, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("${car.rating}", fontSize = 12.sp, color = AppColors.Gray600)
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Filled.LocationOn, null, tint = AppColors.Gray400, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(2.dp))
                    Text(car.location, fontSize = 12.sp, color = AppColors.Gray600)
                }
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(formatCedis(car.pricePerDay), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = AppColors.OrangePrimary)
                    Text(" /day", fontSize = 11.sp, color = AppColors.Gray500, modifier = Modifier.padding(bottom = 1.dp))
                }
            }
        }
    }
}
