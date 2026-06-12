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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.data.SaleCar
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketplaceScreen(navController: NavController) {
    var query by remember { mutableStateOf("") }
    var condition by remember { mutableStateOf("All") }
    val conditions = listOf("All", "New", "Foreign Used", "Locally Used")

    val filtered = MockData.saleCars.filter {
        (condition == "All" || it.condition == condition) &&
            (query.isBlank() || "${it.brand} ${it.model}".contains(query, ignoreCase = true))
    }

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("Marketplace", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppColors.White)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Search, null, tint = AppColors.Gray500, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(10.dp))
                BasicTextField(
                    value = query,
                    onValueChange = { query = it },
                    singleLine = true,
                    textStyle = TextStyle(fontSize = 14.sp, color = AppColors.Gray900),
                    cursorBrush = SolidColor(AppColors.OrangePrimary),
                    modifier = Modifier.weight(1f),
                    decorationBox = { inner ->
                        if (query.isEmpty()) Text("Search cars for sale...", fontSize = 14.sp, color = AppColors.Gray500)
                        inner()
                    }
                )
            }
            Spacer(Modifier.height(14.dp))
            LazyRow(contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(conditions) { c ->
                    val isSel = c == condition
                    Text(
                        c,
                        color = if (isSel) AppColors.White else AppColors.PurpleMuted,
                        fontSize = 13.sp,
                        fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSel) AppColors.OrangePrimary else AppColors.PurpleDark)
                            .clickable { condition = c }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
            LazyColumn(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(filtered) { sale -> SaleCarCard(sale) }
            }
        }
    }
}

@Composable
private fun SaleCarCard(sale: SaleCar) {
    Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(AppColors.White)) {
        Box {
            Box(modifier = Modifier.fillMaxWidth().height(180.dp).background(AppColors.Gray100)) {
                AsyncImage(model = sale.image, contentDescription = sale.model, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            }
            if (sale.isFeatured) {
                Pill("⭐ Featured", AppColors.OrangePrimary, AppColors.White, modifier = Modifier.padding(12.dp))
            }
            Pill(sale.condition, AppColors.PurpleDeep.copy(alpha = 0.85f), AppColors.White, modifier = Modifier.padding(12.dp).align(Alignment.TopEnd))
        }
        Column(Modifier.padding(16.dp)) {
            Row {
                Column(Modifier.weight(1f)) {
                    Text("${sale.brand} ${sale.model}", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColors.Gray900)
                    Text("${sale.year} · ${sale.location}", fontSize = 13.sp, color = AppColors.Gray500)
                }
                Text(formatCedis(sale.salePrice), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColors.OrangePrimary)
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                IconStat(Icons.Filled.Speed, "${sale.mileage / 1000}k km")
                IconStat(Icons.Filled.RemoveRedEye, "${sale.views} views")
            }
            Spacer(Modifier.height(12.dp))
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AppColors.Gray200))
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(AppColors.Gray100)) {
                    AsyncImage(model = sale.dealerAvatar, contentDescription = sale.dealerName, contentScale = ContentScale.Crop, modifier = Modifier.size(40.dp))
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(sale.dealerName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = AppColors.Gray900)
                    Text("Verified Dealer", fontSize = 11.sp, color = AppColors.Success)
                }
                CircleBtn(Icons.Filled.Chat, AppColors.Success) {}
                Spacer(Modifier.width(8.dp))
                CircleBtn(Icons.Filled.Call, AppColors.Info) {}
            }
        }
    }
}

@Composable
private fun IconStat(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = AppColors.Gray500, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(4.dp))
        Text(text, fontSize = 12.sp, color = AppColors.Gray600)
    }
}
