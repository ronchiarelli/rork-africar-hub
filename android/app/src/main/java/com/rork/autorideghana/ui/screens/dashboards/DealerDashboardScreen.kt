package com.rork.autorideghana.ui.screens.dashboards

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.rork.autorideghana.data.DealerListing
import com.rork.autorideghana.data.Lead
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.screens.StatCard
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DealerDashboardScreen(navController: NavController, embedded: Boolean = false) {
    if (embedded) {
        DealerContent()
    } else {
        Scaffold(
            containerColor = AppColors.PurpleDeep,
            topBar = {
                TopAppBar(
                    title = { Text("Dealer Dashboard", fontWeight = FontWeight.Bold, color = AppColors.White) },
                    navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
                )
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) { DealerContent() }
        }
    }
}

@Composable
private fun DealerContent() {
    val totalViews = MockData.dealerListings.sumOf { it.views }
    val totalLeads = MockData.dealerListings.sumOf { it.leads }
    val active = MockData.dealerListings.count { it.status == "active" }

    Column(modifier = Modifier.fillMaxSize().background(AppColors.PurpleDeep).verticalScroll(rememberScrollState()).padding(20.dp)) {
        Spacer(Modifier.height(8.dp))
        Text("Dealership", color = AppColors.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("Track your listings and leads", color = AppColors.PurpleMuted, fontSize = 14.sp)

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("$totalViews", "Views", AppColors.Info, Modifier.weight(1f))
            StatCard("$totalLeads", "Leads", AppColors.OrangePrimary, Modifier.weight(1f))
            StatCard("$active", "Active", AppColors.Success, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
        Text("My Listings", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        MockData.dealerListings.forEach { listing ->
            ListingCard(listing)
            Spacer(Modifier.height(12.dp))
        }

        Spacer(Modifier.height(12.dp))
        Text("Recent Leads", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        MockData.leads.forEach { lead ->
            LeadCard(lead)
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun ListingCard(listing: DealerListing) {
    Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(AppColors.PurpleDark).padding(14.dp)) {
        Box(modifier = Modifier.size(70.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.Gray100)) {
            AsyncImage(model = listing.car.image, contentDescription = listing.car.model, contentScale = ContentScale.Crop, modifier = Modifier.size(70.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.Top) {
                Text("${listing.car.brand} ${listing.car.model}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColors.White, modifier = Modifier.weight(1f))
                if (listing.listingType == "featured") Pill("Featured", AppColors.OrangePrimary, AppColors.White)
            }
            Spacer(Modifier.height(4.dp))
            Text(formatCedis(listing.askingPrice), fontWeight = FontWeight.ExtraBold, color = AppColors.OrangeBright, fontSize = 15.sp)
            Spacer(Modifier.height(4.dp))
            Text("${listing.views} views · ${listing.leads} leads · ${listing.status}", fontSize = 12.sp, color = AppColors.PurpleMuted)
        }
    }
}

@Composable
private fun LeadCard(lead: Lead) {
    val color = when (lead.status) {
        "new" -> AppColors.Info
        "contacted" -> AppColors.Warning
        "converted" -> AppColors.Success
        else -> AppColors.Gray500
    }
    Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(14.dp)) {
        Box(modifier = Modifier.size(42.dp).clip(CircleShape).background(AppColors.PurpleMedium.copy(alpha = 0.5f)), contentAlignment = Alignment.Center) {
            Text(lead.customerName.take(1), color = AppColors.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.Top) {
                Text(lead.customerName, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.White, modifier = Modifier.weight(1f))
                Pill(lead.status.replaceFirstChar { it.uppercase() }, color.copy(alpha = 0.2f), color)
            }
            Spacer(Modifier.height(2.dp))
            Text(lead.carModel, fontSize = 12.sp, color = AppColors.OrangeBright)
            Spacer(Modifier.height(4.dp))
            Text(lead.message, fontSize = 12.sp, color = AppColors.PurpleMuted, lineHeight = 17.sp)
        }
    }
}
