package com.rork.autorideghana.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.rork.autorideghana.store.AppViewModel
import com.rork.autorideghana.ui.screens.BookingDetailScreen
import com.rork.autorideghana.ui.screens.BookingScreen
import com.rork.autorideghana.ui.screens.CarDetailsScreen
import com.rork.autorideghana.ui.screens.FavoritesScreen
import com.rork.autorideghana.ui.screens.HelpSupportScreen
import com.rork.autorideghana.ui.screens.KycScreen
import com.rork.autorideghana.ui.screens.LoginScreen
import com.rork.autorideghana.ui.screens.MainTabScreen
import com.rork.autorideghana.ui.screens.MarketplaceScreen
import com.rork.autorideghana.ui.screens.NotificationsScreen
import com.rork.autorideghana.ui.screens.OtpScreen
import com.rork.autorideghana.ui.screens.PaymentScreen
import com.rork.autorideghana.ui.screens.RegisterScreen
import com.rork.autorideghana.ui.screens.ReviewScreen
import com.rork.autorideghana.ui.screens.SearchScreen
import com.rork.autorideghana.ui.screens.SettingsScreen
import com.rork.autorideghana.ui.screens.WalletScreen
import com.rork.autorideghana.ui.screens.WelcomeScreen
import com.rork.autorideghana.ui.screens.dashboards.AdminDashboardScreen
import com.rork.autorideghana.ui.screens.dashboards.DealerDashboardScreen
import com.rork.autorideghana.ui.screens.dashboards.FleetDashboardScreen

object Routes {
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val OTP = "otp"
    const val MAIN = "main"
    const val CAR_DETAILS = "car_details/{id}"
    const val BOOKING = "booking/{id}"
    const val PAYMENT = "payment/{id}"
    const val BOOKING_DETAIL = "booking_detail/{id}"
    const val REVIEW = "review/{id}"
    const val MARKETPLACE = "marketplace"
    const val FAVORITES = "favorites"
    const val NOTIFICATIONS = "notifications"
    const val KYC = "kyc"
    const val SETTINGS = "settings"
    const val HELP = "help"
    const val WALLET = "wallet"
    const val SEARCH = "search"
    const val FLEET_DASHBOARD = "fleet_dashboard"
    const val DEALER_DASHBOARD = "dealer_dashboard"
    const val ADMIN_DASHBOARD = "admin_dashboard"

    fun carDetails(id: String) = "car_details/$id"
    fun booking(id: String) = "booking/$id"
    fun payment(id: String) = "payment/$id"
    fun bookingDetail(id: String) = "booking_detail/$id"
    fun review(id: String) = "review/$id"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val appViewModel: AppViewModel = viewModel()
    val state by appViewModel.state.collectAsState()

    NavHost(
        navController = navController,
        startDestination = if (state.isLoggedIn) Routes.MAIN else Routes.WELCOME
    ) {
        composable(Routes.WELCOME) { WelcomeScreen(navController) }
        composable(Routes.LOGIN) { LoginScreen(navController, appViewModel) }
        composable(Routes.REGISTER) { RegisterScreen(navController) }
        composable(Routes.OTP) { OtpScreen(navController, appViewModel) }
        composable(Routes.MAIN) { MainTabScreen(navController, appViewModel) }
        composable(Routes.CAR_DETAILS) { CarDetailsScreen(navController, appViewModel, it.arguments?.getString("id")) }
        composable(Routes.BOOKING) { BookingScreen(navController, it.arguments?.getString("id")) }
        composable(Routes.PAYMENT) { PaymentScreen(navController, it.arguments?.getString("id")) }
        composable(Routes.BOOKING_DETAIL) { BookingDetailScreen(navController, it.arguments?.getString("id")) }
        composable(Routes.REVIEW) { ReviewScreen(navController, it.arguments?.getString("id")) }
        composable(Routes.MARKETPLACE) { MarketplaceScreen(navController) }
        composable(Routes.FAVORITES) { FavoritesScreen(navController, appViewModel) }
        composable(Routes.NOTIFICATIONS) { NotificationsScreen(navController) }
        composable(Routes.KYC) { KycScreen(navController) }
        composable(Routes.SETTINGS) { SettingsScreen(navController, appViewModel) }
        composable(Routes.HELP) { HelpSupportScreen(navController) }
        composable(Routes.WALLET) { WalletScreen(navController) }
        composable(Routes.SEARCH) { SearchScreen(navController, appViewModel) }
        composable(Routes.FLEET_DASHBOARD) { FleetDashboardScreen(navController) }
        composable(Routes.DEALER_DASHBOARD) { DealerDashboardScreen(navController) }
        composable(Routes.ADMIN_DASHBOARD) { AdminDashboardScreen(navController) }
    }
}
