package com.rork.autorideghana.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.ui.components.PurpleGradientBackground
import com.rork.autorideghana.ui.components.clickableNoRipple
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun RegisterScreen(navController: NavController) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    PurpleGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White)
            }
            Spacer(Modifier.height(16.dp))
            Row {
                Text("Create ", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.White)
                Text("account", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.OrangeBright)
            }
            Spacer(Modifier.height(8.dp))
            Text("Join thousands of drivers across Ghana.", fontSize = 15.sp, color = AppColors.PurpleMuted)
            Spacer(Modifier.height(32.dp))

            AuthField("Full Name", name, { name = it }, KeyboardType.Text)
            Spacer(Modifier.height(14.dp))
            AuthField("Email", email, { email = it }, KeyboardType.Email)
            Spacer(Modifier.height(14.dp))
            AuthField("Phone Number", phone, { phone = it }, KeyboardType.Phone)
            Spacer(Modifier.height(14.dp))
            AuthField("Password", password, { password = it }, KeyboardType.Password, isPassword = true)
            Spacer(Modifier.height(28.dp))

            Button(
                onClick = { navController.navigate(Routes.OTP) },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
            ) {
                Text("Continue", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
            }
            Spacer(Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                Text("Already have an account? ", color = AppColors.PurpleMuted, fontSize = 14.sp)
                Text("Sign in", color = AppColors.OrangeBright, fontSize = 14.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickableNoRipple { navController.navigate(Routes.LOGIN) })
            }
        }
    }
}
