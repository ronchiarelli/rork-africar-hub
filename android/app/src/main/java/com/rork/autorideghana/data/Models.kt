package com.rork.autorideghana.data

data class Car(
    val id: String,
    val brand: String,
    val model: String,
    val year: Int,
    val category: String,
    val image: String,
    val images: List<String>,
    val pricePerDay: Int,
    val pricePerWeek: Int,
    val location: String,
    val seats: Int,
    val transmission: String,
    val fuelType: String,
    val horsepower: Int,
    val hasAC: Boolean,
    val rating: Double,
    val reviewCount: Int,
    val isAvailable: Boolean,
    val description: String,
    val features: List<String>,
    val ownerName: String,
    val ownerPhone: String,
)

data class Brand(
    val id: String,
    val name: String,
    val logo: String,
    val carCount: Int,
)

enum class BookingStatus { PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED }

data class Booking(
    val id: String,
    val car: Car,
    val pickupDate: String,
    val returnDate: String,
    val pickupLocation: String,
    val totalDays: Int,
    val totalPrice: Int,
    val status: BookingStatus,
    val createdAt: String,
)

enum class UserRole(val label: String) {
    CUSTOMER("Customer"),
    FLEET_OWNER("Fleet Owner"),
    DEALERSHIP("Dealership"),
    ADMIN("Admin"),
}

data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val avatar: String,
    val isVerified: Boolean,
    val verificationStatus: String,
    val totalBookings: Int,
    val memberSince: String,
    val role: UserRole,
)

enum class FleetStatus { ACTIVE, MAINTENANCE, RENTED, INACTIVE }

data class FleetVehicle(
    val id: String,
    val car: Car,
    val status: FleetStatus,
    val totalEarnings: Int,
    val totalTrips: Int,
    val nextMaintenance: String,
)

data class EarningsSummary(
    val totalRevenue: Int,
    val thisMonth: Int,
    val lastMonth: Int,
    val pendingPayouts: Int,
    val completedTrips: Int,
    val activeRentals: Int,
)

data class DealerListing(
    val id: String,
    val car: Car,
    val listingType: String,
    val askingPrice: Int,
    val views: Int,
    val leads: Int,
    val status: String,
    val createdAt: String,
)

data class Lead(
    val id: String,
    val customerName: String,
    val customerPhone: String,
    val carModel: String,
    val message: String,
    val status: String,
    val createdAt: String,
)

data class AdminUser(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val status: String,
    val joinDate: String,
    val avatar: String,
)

data class AdminStats(
    val totalUsers: Int,
    val totalBookings: Int,
    val totalRevenue: Int,
    val activeListings: Int,
    val pendingKYC: Int,
    val monthlyGrowth: Double,
)

data class KYCDocument(
    val id: String,
    val type: String,
    val label: String,
    val status: String,
    val uploadedAt: String? = null,
)

data class SaleCar(
    val id: String,
    val brand: String,
    val model: String,
    val year: Int,
    val category: String,
    val image: String,
    val images: List<String>,
    val salePrice: Int,
    val mileage: Int,
    val location: String,
    val fuelType: String,
    val transmission: String,
    val condition: String,
    val dealerName: String,
    val dealerPhone: String,
    val dealerAvatar: String,
    val isFeatured: Boolean,
    val views: Int,
    val description: String,
    val features: List<String>,
)

data class PaymentMethod(
    val id: String,
    val type: String,
    val label: String,
    val icon: String,
    val details: String? = null,
)

data class WalletTransaction(
    val id: String,
    val type: String,
    val amount: Int,
    val description: String,
    val date: String,
    val status: String,
)

data class WalletInfo(
    val balance: Int,
    val currency: String,
    val transactions: List<WalletTransaction>,
)

data class AppNotification(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val timestamp: String,
    val isRead: Boolean,
)
