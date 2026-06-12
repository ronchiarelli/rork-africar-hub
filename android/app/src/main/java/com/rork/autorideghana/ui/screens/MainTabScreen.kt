package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.theme.AppColors

private data class TabItem(val label: String, val selected: ImageVector, val unselected: ImageVector)

@Composable
fun MainTabScreen(navController: NavController, appViewModel: AppViewModel) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf(
        TabItem("Home", Icons.Filled.Home, Icons.Outlined.Home),
        TabItem("Dashboard", Icons.Filled.GridView, Icons.Outlined.GridView),
        TabItem("Bookings", Icons.Filled.DirectionsCar, Icons.Outlined.DirectionsCar),
        TabItem("Profile", Icons.Filled.Person, Icons.Outlined.Person),
    )

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        bottomBar = {
            NavigationBar(containerColor = AppColors.White) {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(if (selectedTab == index) tab.selected else tab.unselected, tab.label)
                        },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppColors.OrangePrimary,
                            selectedTextColor = AppColors.OrangePrimary,
                            unselectedIconColor = AppColors.Gray500,
                            unselectedTextColor = AppColors.Gray500,
                            indicatorColor = AppColors.OrangeFaint,
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (selectedTab) {
                0 -> HomeScreen(navController, appViewModel)
                1 -> DashboardScreen(navController, appViewModel)
                2 -> BookingsScreen(navController)
                else -> ProfileScreen(navController, appViewModel)
            }
        }
    }
}
