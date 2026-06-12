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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.CarListItem
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(navController: NavController, appViewModel: AppViewModel) {
    val state by appViewModel.state.collectAsState()
    var query by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("All") }
    var transmission by remember { mutableStateOf("All") }
    val categories = listOf("All", "SUV", "Sedan")
    val transmissions = listOf("All", "Automatic", "Manual")

    val results = MockData.cars.filter {
        (query.isBlank() || "${it.brand} ${it.model} ${it.location}".contains(query, ignoreCase = true)) &&
            (category == "All" || it.category == category) &&
            (transmission == "All" || it.transmission == transmission)
    }

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("Search Cars", fontWeight = FontWeight.Bold, color = AppColors.White) },
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
                        if (query.isEmpty()) Text("Search cars, brands, locations...", fontSize = 14.sp, color = AppColors.Gray500)
                        inner()
                    }
                )
            }

            Spacer(Modifier.height(14.dp))
            FilterChipsRow("Category", categories, category) { category = it }
            Spacer(Modifier.height(10.dp))
            FilterChipsRow("Transmission", transmissions, transmission) { transmission = it }

            Spacer(Modifier.height(14.dp))
            Text("${results.size} cars found", color = AppColors.PurpleMuted, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 20.dp))
            Spacer(Modifier.height(10.dp))
            LazyColumn(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(results) { car ->
                    CarListItem(
                        car = car,
                        isFavorite = state.favoriteIds.contains(car.id),
                        onClick = { navController.navigate(Routes.carDetails(car.id)) },
                        onToggleFavorite = { appViewModel.toggleFavorite(car.id) },
                    )
                }
                item { Spacer(Modifier.height(20.dp)) }
            }
        }
    }
}

@Composable
private fun FilterChipsRow(label: String, options: List<String>, selected: String, onSelect: (String) -> Unit) {
    Column {
        Text(label, color = AppColors.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 20.dp))
        Spacer(Modifier.height(8.dp))
        LazyRow(contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(options) { opt ->
                val isSel = opt == selected
                Text(
                    opt,
                    color = if (isSel) AppColors.White else AppColors.PurpleMuted,
                    fontSize = 13.sp,
                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSel) AppColors.OrangePrimary else AppColors.PurpleDark)
                        .clickable { onSelect(opt) }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
        }
    }
}
