package com.rork.autorideghana.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.KYCDocument
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KycScreen(navController: NavController) {
    val statuses = remember {
        mutableStateMapOf<String, String>().apply {
            MockData.kycDocuments.forEach { put(it.id, it.status) }
        }
    }
    val total = MockData.kycDocuments.size
    val done = statuses.values.count { it == "verified" || it == "uploaded" }
    val progress by animateFloatAsState(done.toFloat() / total, tween(500), label = "progress")

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("KYC Verification", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            Text("Verify your identity", color = AppColors.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp))
            Text("Complete verification to unlock rentals and higher booking limits.", color = AppColors.PurpleMuted, fontSize = 14.sp)

            Spacer(Modifier.height(20.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("$done of $total complete", color = AppColors.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Text("${(progress * 100).toInt()}%", color = AppColors.OrangeBright, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(AppColors.PurpleDark)) {
                Box(modifier = Modifier.fillMaxWidth(progress).height(8.dp).clip(RoundedCornerShape(4.dp)).background(AppColors.OrangePrimary))
            }

            Spacer(Modifier.height(24.dp))
            MockData.kycDocuments.forEach { doc ->
                KycDocRow(doc, statuses[doc.id] ?: "not_uploaded") {
                    statuses[doc.id] = "uploaded"
                }
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun KycDocRow(doc: KYCDocument, status: String, onUpload: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.PurpleMedium.copy(alpha = 0.5f)), contentAlignment = Alignment.Center) {
            Icon(Icons.Filled.Description, null, tint = AppColors.OrangeBright, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(doc.label, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColors.White)
            Spacer(Modifier.height(4.dp))
            when (status) {
                "verified" -> Pill("Verified", AppColors.Success.copy(alpha = 0.2f), AppColors.Success)
                "uploaded" -> Pill("Under Review", AppColors.Warning.copy(alpha = 0.2f), AppColors.Warning)
                "rejected" -> Pill("Rejected", AppColors.Error.copy(alpha = 0.2f), AppColors.Error)
                else -> Pill("Required", AppColors.PurpleMedium.copy(alpha = 0.5f), AppColors.PurpleMuted)
            }
        }
        if (status == "verified") {
            Icon(Icons.Filled.CheckCircle, null, tint = AppColors.Success, modifier = Modifier.size(26.dp))
        } else if (status == "not_uploaded" || status == "rejected") {
            Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(AppColors.OrangePrimary).clickable(onClick = onUpload), contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Add, "Upload", tint = AppColors.White, modifier = Modifier.size(22.dp))
            }
        }
    }
}
