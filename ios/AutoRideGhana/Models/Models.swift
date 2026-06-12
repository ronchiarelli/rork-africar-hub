import Foundation

enum Transmission: String, Codable {
    case automatic = "Automatic"
    case manual = "Manual"
}

enum FuelType: String, Codable {
    case petrol = "Petrol"
    case diesel = "Diesel"
    case hybrid = "Hybrid"
    case electric = "Electric"
}

struct Car: Identifiable, Hashable {
    let id: String
    let brand: String
    let model: String
    let year: Int
    let category: String
    let image: String
    let images: [String]
    let pricePerDay: Int
    let pricePerWeek: Int
    let location: String
    let seats: Int
    let transmission: Transmission
    let fuelType: FuelType
    let horsepower: Int
    let hasAC: Bool
    let rating: Double
    let reviewCount: Int
    let isAvailable: Bool
    let description: String
    let features: [String]
    let ownerName: String
    let ownerPhone: String
}

struct Brand: Identifiable, Hashable {
    let id: String
    let name: String
    let logo: String
    let carCount: Int
}

enum BookingStatus: String, Codable {
    case pending, approved, active, completed, cancelled
}

struct Booking: Identifiable, Hashable {
    let id: String
    let carId: String
    let car: Car
    let pickupDate: String
    let returnDate: String
    let pickupLocation: String
    let totalDays: Int
    let totalPrice: Int
    var status: BookingStatus
    let createdAt: String
}

enum UserRole: String, Codable, CaseIterable {
    case customer
    case fleetOwner = "fleet_owner"
    case dealership
    case admin

    var label: String {
        switch self {
        case .customer: return "Customer"
        case .fleetOwner: return "Fleet Owner"
        case .dealership: return "Dealership"
        case .admin: return "Admin"
        }
    }
}

enum VerificationStatus: String, Codable {
    case none, pending, approved, rejected
}

struct UserProfile: Identifiable, Hashable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let avatar: String
    let isVerified: Bool
    let verificationStatus: VerificationStatus
    let totalBookings: Int
    let memberSince: String
    let role: UserRole
}

enum FleetStatus: String, Codable {
    case active, maintenance, rented, inactive
}

struct FleetVehicle: Identifiable, Hashable {
    let id: String
    let carId: String
    let car: Car
    let status: FleetStatus
    let totalEarnings: Int
    let totalTrips: Int
    let nextMaintenance: String
}

struct EarningsSummary: Hashable {
    let totalRevenue: Int
    let thisMonth: Int
    let lastMonth: Int
    let pendingPayouts: Int
    let completedTrips: Int
    let activeRentals: Int
}

enum ListingType: String, Codable {
    case sale, featured
}

enum ListingStatus: String, Codable {
    case active, sold, draft
}

struct DealerListing: Identifiable, Hashable {
    let id: String
    let car: Car
    let listingType: ListingType
    let askingPrice: Int
    let views: Int
    let leads: Int
    let status: ListingStatus
    let createdAt: String
}

enum LeadStatus: String, Codable {
    case new, contacted, converted, lost
}

struct Lead: Identifiable, Hashable {
    let id: String
    let customerName: String
    let customerPhone: String
    let carModel: String
    let message: String
    let status: LeadStatus
    let createdAt: String
}

enum AdminUserStatus: String, Codable {
    case active, suspended
    case pendingKyc = "pending_kyc"

    var label: String {
        switch self {
        case .active: return "Active"
        case .suspended: return "Suspended"
        case .pendingKyc: return "Pending KYC"
        }
    }
}

struct AdminUser: Identifiable, Hashable {
    let id: String
    let name: String
    let email: String
    let role: UserRole
    var status: AdminUserStatus
    let joinDate: String
    let avatar: String
}

struct AdminStats: Hashable {
    let totalUsers: Int
    let totalBookings: Int
    let totalRevenue: Int
    let activeListings: Int
    let pendingKYC: Int
    let monthlyGrowth: Double
}

enum KYCStatus: String, Codable {
    case notUploaded = "not_uploaded"
    case uploaded, verified, rejected
}

enum KYCType: String, Codable {
    case ghanaCard = "ghana_card"
    case passport
    case driversLicense = "drivers_license"
    case selfie
}

struct KYCDocument: Identifiable, Hashable {
    let id: String
    let type: KYCType
    let label: String
    var status: KYCStatus
    var uploadedAt: String?
}

enum CarCondition: String, Codable {
    case new = "New"
    case foreignUsed = "Foreign Used"
    case locallyUsed = "Locally Used"
}

struct SaleCar: Identifiable, Hashable {
    let id: String
    let brand: String
    let model: String
    let year: Int
    let category: String
    let image: String
    let images: [String]
    let salePrice: Int
    let mileage: Int
    let location: String
    let fuelType: FuelType
    let transmission: Transmission
    let condition: CarCondition
    let dealerName: String
    let dealerPhone: String
    let dealerAvatar: String
    let isFeatured: Bool
    let views: Int
    let description: String
    let features: [String]
}

enum PaymentType: String, Codable {
    case momoMtn = "momo_mtn"
    case momoVodafone = "momo_vodafone"
    case momoAirteltigo = "momo_airteltigo"
    case card
    case wallet
}

struct PaymentMethod: Identifiable, Hashable {
    let id: String
    let type: PaymentType
    let label: String
    let icon: String
    let details: String?
}

enum TransactionType: String, Codable {
    case credit, debit
}

enum TransactionStatus: String, Codable {
    case completed, pending, failed
}

struct WalletTransaction: Identifiable, Hashable {
    let id: String
    let type: TransactionType
    let amount: Int
    let description: String
    let date: String
    let status: TransactionStatus
}

struct WalletInfo: Hashable {
    let balance: Int
    let currency: String
    let transactions: [WalletTransaction]
}

enum NotificationType: String, Codable {
    case booking, payment, promo, kyc, system
}

struct AppNotification: Identifiable, Hashable {
    let id: String
    let type: NotificationType
    let title: String
    let message: String
    let timestamp: String
    var isRead: Bool
    let actionCarId: String?
}
