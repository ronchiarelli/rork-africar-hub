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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.components.PurpleGradientBackground
import com.rork.autorideghana.ui.components.clickableNoRipple
import com.rork.autorideghana.ui.navigation.Routes
import com.rork.autorideghana.ui.theme.AppColors

@Composable
fun LoginScreen(navController: NavController, appViewModel: AppViewModel) {
    var email by remember { mutableStateOf("kwaku.mensah@email.com") }
    var password by remember { mutableStateOf("password") }

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
            Spacer(Modifier.height(20.dp))
            Text("Welcome", fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.White)
            Text("back", fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, color = AppColors.OrangeBright)
            Spacer(Modifier.height(8.dp))
            Text("Sign in to continue renting premium cars.", fontSize = 15.sp, color = AppColors.PurpleMuted)
            Spacer(Modifier.height(36.dp))

            AuthField("Email", email, { email = it }, KeyboardType.Email)
            Spacer(Modifier.height(16.dp))
            AuthField("Password", password, { password = it }, KeyboardType.Password, isPassword = true)
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = {}) {
                    Text("Forgot password?", color = AppColors.OrangeSoft, fontSize = 13.sp)
                }
            }
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    appViewModel.login()
                    navController.navigate(Routes.MAIN) { popUpTo(Routes.WELCOME) { inclusive = true } }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
            ) {
                Text("Sign In", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
            }
            Spacer(Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                Text("Don't have an account? ", color = AppColors.PurpleMuted, fontSize = 14.sp)
                Text(
                    "Sign up",
                    color = AppColors.OrangeBright,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 0.dp).clickableNoRipple { navController.navigate(Routes.REGISTER) }
                )
            }
        }
    }
}

@Composable
fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType,
    isPassword: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, color = AppColors.PurpleMuted) },
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = AppColors.White,
            unfocusedTextColor = AppColors.White,
            focusedBorderColor = AppColors.OrangePrimary,
            unfocusedBorderColor = AppColors.PurpleLight,
            cursorColor = AppColors.OrangePrimary,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}
