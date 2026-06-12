package com.rork.autorideghana.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController, appViewModel: AppViewModel) {
    var pushNotif by remember { mutableStateOf(true) }
    var emailNotif by remember { mutableStateOf(false) }
    var biometric by remember { mutableStateOf(true) }
    var twoFactor by remember { mutableStateOf(false) }
    var darkMode by remember { mutableStateOf(true) }

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp)) {
            SettingSection("Notifications") {
                SettingToggle(Icons.Filled.Notifications, "Push Notifications", pushNotif) { pushNotif = it }
                SettingToggle(Icons.Filled.Notifications, "Email Notifications", emailNotif) { emailNotif = it }
            }
            Spacer(Modifier.height(20.dp))
            SettingSection("Security") {
                SettingToggle(Icons.Filled.Fingerprint, "Biometric Login", biometric) { biometric = it }
                SettingToggle(Icons.Filled.Security, "Two-Factor Authentication", twoFactor) { twoFactor = it }
                SettingLink(Icons.Filled.Lock, "Change Password") {}
            }
            Spacer(Modifier.height(20.dp))
            SettingSection("Appearance") {
                SettingToggle(Icons.Filled.DarkMode, "Dark Mode", darkMode) { darkMode = it }
                SettingLink(Icons.Filled.Language, "Language · English") {}
            }
            Spacer(Modifier.height(20.dp))
            SettingSection("About") {
                SettingLink(Icons.Filled.PrivacyTip, "Privacy Policy") {}
                SettingLink(Icons.Filled.PrivacyTip, "Terms of Service") {}
            }
            Spacer(Modifier.height(24.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppColors.Error.copy(alpha = 0.12f))
                    .clickable {
                        appViewModel.logout()
                        navController.navigate(Routes.WELCOME) { popUpTo(0) { inclusive = true } }
                    }
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Log Out", color = AppColors.Error, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
            Spacer(Modifier.height(12.dp))
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("Delete Account", color = AppColors.PurpleMuted, fontSize = 13.sp)
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun SettingSection(title: String, content: @Composable () -> Unit) {
    Text(title, color = AppColors.OrangeBright, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(10.dp))
    Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark)) {
        content()
    }
}

@Composable
private fun SettingToggle(icon: ImageVector, label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = AppColors.PurpleMuted, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(14.dp))
        Text(label, color = AppColors.White, fontSize = 15.sp, modifier = Modifier.weight(1f))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = AppColors.White,
                checkedTrackColor = AppColors.OrangePrimary,
                uncheckedThumbColor = AppColors.PurpleMuted,
                uncheckedTrackColor = AppColors.PurpleMedium,
            )
        )
    }
}

@Composable
private fun SettingLink(icon: ImageVector, label: String, onClick: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = AppColors.PurpleMuted, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(14.dp))
        Text(label, color = AppColors.White, fontSize = 15.sp, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = AppColors.PurpleMuted, modifier = Modifier.size(18.dp))
    }
}
