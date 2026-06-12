package com.rork.autorideghana.ui.screens

import androidx.compose.animation.animateContentSize
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpSupportScreen(navController: NavController) {
    var expanded by remember { mutableIntStateOf(-1) }
    val faqs = listOf(
        "How do I book a car?" to "Browse available cars on the Home screen, tap one to view details, then tap 'Rent Now'. Choose your dates and location, and complete payment.",
        "What payment methods are accepted?" to "We accept MTN Mobile Money, Vodafone Cash, AirtelTigo Money, Visa/Mastercard, and your AutoRide Wallet balance.",
        "How does KYC verification work?" to "Upload your Ghana Card, Driver's License, and a selfie. Verification usually takes up to 24 hours.",
        "Can I cancel a booking?" to "Yes. Cancellations made 24 hours before pickup are fully refunded to your wallet.",
        "How do I become a fleet owner?" to "Switch your role from the Profile screen and complete business verification to start listing your vehicles.",
        "Is insurance included?" to "Basic insurance is included in every rental. Premium coverage can be added at checkout.",
        "How do I contact a car owner?" to "On any car details page, use the WhatsApp or Call buttons to reach the owner directly.",
    )

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("Help & Support", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            Text("How can we help?", color = AppColors.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ContactBtn(Icons.Filled.Chat, "WhatsApp", AppColors.Success, Modifier.weight(1f))
                ContactBtn(Icons.Filled.Call, "Call Us", AppColors.Info, Modifier.weight(1f))
                ContactBtn(Icons.Filled.Email, "Email", AppColors.OrangePrimary, Modifier.weight(1f))
            }

            Spacer(Modifier.height(28.dp))
            Text("Frequently Asked", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(12.dp))
            faqs.forEachIndexed { index, faq ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(AppColors.PurpleDark)
                        .clickable { expanded = if (expanded == index) -1 else index }
                        .animateContentSize()
                        .padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(faq.first, color = AppColors.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Icon(if (expanded == index) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, null, tint = AppColors.OrangeBright)
                    }
                    if (expanded == index) {
                        Spacer(Modifier.height(10.dp))
                        Text(faq.second, color = AppColors.PurpleMuted, fontSize = 13.sp, lineHeight = 19.sp)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun ContactBtn(icon: ImageVector, label: String, color: Color, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(vertical = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(color.copy(alpha = 0.18f)), contentAlignment = Alignment.Center) {
            Icon(icon, label, tint = color, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(label, color = AppColors.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}
