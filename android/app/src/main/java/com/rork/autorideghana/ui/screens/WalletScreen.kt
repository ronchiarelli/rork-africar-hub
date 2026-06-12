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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.data.WalletTransaction
import com.rork.autorideghana.ui.components.formatCedis
import com.rork.autorideghana.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(navController: NavController) {
    val wallet = MockData.wallet
    val totalIn = wallet.transactions.filter { it.type == "credit" }.sumOf { it.amount }
    val totalOut = wallet.transactions.filter { it.type == "debit" }.sumOf { it.amount }

    Scaffold(
        containerColor = AppColors.PurpleDeep,
        topBar = {
            TopAppBar(
                title = { Text("My Wallet", fontWeight = FontWeight.Bold, color = AppColors.White) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = AppColors.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.PurpleDeep)
            )
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp)) {
            item {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(Brush.linearGradient(listOf(AppColors.OrangePrimary, AppColors.OrangeBright)))
                        .padding(24.dp)
                ) {
                    Column {
                        Text("Available Balance", color = AppColors.White.copy(alpha = 0.85f), fontSize = 14.sp)
                        Spacer(Modifier.height(6.dp))
                        Text("${wallet.currency} ${"%,d".format(wallet.balance)}.00", color = AppColors.White, fontSize = 34.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(AppColors.White)
                                .clickable {}
                                .padding(horizontal = 18.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Add, null, tint = AppColors.OrangePrimary, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Top Up", color = AppColors.OrangePrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(formatCedis(totalIn), "Total In", AppColors.Success, Modifier.weight(1f))
                    StatCard(formatCedis(totalOut), "Total Out", AppColors.Error, Modifier.weight(1f))
                }
                Spacer(Modifier.height(24.dp))
                Text("Transactions", color = AppColors.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
            }
            items(wallet.transactions) { tx ->
                TransactionRow(tx)
                Spacer(Modifier.height(10.dp))
            }
            item { Spacer(Modifier.height(20.dp)) }
        }
    }
}

@Composable
private fun TransactionRow(tx: WalletTransaction) {
    val isCredit = tx.type == "credit"
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(AppColors.PurpleDark).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(42.dp).clip(CircleShape).background((if (isCredit) AppColors.Success else AppColors.Error).copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(if (isCredit) Icons.Filled.ArrowDownward else Icons.Filled.ArrowUpward, null, tint = if (isCredit) AppColors.Success else AppColors.Error, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(tx.description, color = AppColors.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text("${tx.date} · ${tx.status}", color = AppColors.PurpleMuted, fontSize = 12.sp)
        }
        Text(
            "${if (isCredit) "+" else "-"}${formatCedis(tx.amount)}",
            color = if (isCredit) AppColors.Success else AppColors.White,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
}
