package com.rork.autorideghana.ui.screens

import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.ui.components.Pill
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewScreen(navController: NavController, bookingId: String?) {
    val booking = MockData.bookingById(bookingId)
    var rating by remember { mutableIntStateOf(5) }
    var text by remember { mutableStateOf("") }
    val tags = listOf("Clean", "On time", "Great condition", "Friendly owner", "Smooth ride", "Value for money")
    val selectedTags = remember { mutableStateListOf<String>() }

    Scaffold(
        containerColor = AppColors.Gray50,
        topBar = {
            TopAppBar(
                title = { Text("Rate Your Trip", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.White)
            )
        },
        bottomBar = {
            Column(modifier = Modifier.background(AppColors.White).padding(20.dp)) {
                Button(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.OrangePrimary),
                ) {
                    Text("Submit Review", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.White)
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${booking.car.brand} ${booking.car.model}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = AppColors.Gray900)
            Text("How was your experience?", fontSize = 14.sp, color = AppColors.Gray500)
            Spacer(Modifier.height(24.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (i in 1..5) {
                    val filled = i <= rating
                    val scale by animateFloatAsState(if (filled) 1.1f else 1f, label = "star")
                    Icon(
                        imageVector = if (filled) Icons.Filled.Star else Icons.Outlined.StarBorder,
                        contentDescription = "$i star",
                        tint = if (filled) AppColors.Star else AppColors.Gray300,
                        modifier = Modifier.size(44.dp).scale(scale).clickable { rating = i }
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                when (rating) { 5 -> "Excellent!"; 4 -> "Good"; 3 -> "Okay"; 2 -> "Poor"; else -> "Terrible" },
                fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.OrangePrimary
            )

            Spacer(Modifier.height(24.dp))
            Text("What stood out?", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.Gray900, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            ReviewTags(tags, selectedTags)

            Spacer(Modifier.height(24.dp))
            Text("Write a review", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.Gray900, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            Box(modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(16.dp)).background(AppColors.White).padding(16.dp)) {
                BasicTextField(
                    value = text,
                    onValueChange = { text = it },
                    textStyle = TextStyle(fontSize = 14.sp, color = AppColors.Gray900),
                    cursorBrush = SolidColor(AppColors.OrangePrimary),
                    modifier = Modifier.fillMaxSize(),
                    decorationBox = { inner ->
                        if (text.isEmpty()) Text("Share your experience with other drivers...", fontSize = 14.sp, color = AppColors.Gray400)
                        inner()
                    }
                )
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

/** Simple wrapping tag selector using Row chunks. */
@Composable
private fun ReviewTags(tags: List<String>, selected: MutableList<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        tags.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEach { tag ->
                    val isSel = selected.contains(tag)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSel) AppColors.OrangePrimary else AppColors.White)
                            .clickable { if (isSel) selected.remove(tag) else selected.add(tag) }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tag, color = if (isSel) AppColors.White else AppColors.Gray700, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}
