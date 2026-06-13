import Foundation

/// Static mock data mirroring the Expo app's content.
enum MockData {
    static let locations = [
        "Accra", "Kumasi", "Tema", "Takoradi", "Cape Coast",
        "Tamale", "East Legon", "Airport Area", "Cantonments", "Osu",
    ]

    static let cars: [Car] = [
        Car(id: "1", brand: "Toyota", model: "Land Cruiser V8", year: 2023, category: "SUV",
            image: "toyota_land_cruiser_v8",
            images: ["toyota_land_cruiser_v8", "toyota_land_cruiser_v8", "toyota_land_cruiser_v8"],
            pricePerDay: 850, pricePerWeek: 5200, location: "East Legon", seats: 7,
            transmission: .automatic, fuelType: .diesel, horsepower: 304, hasAC: true,
            rating: 4.8, reviewCount: 124, isAvailable: true,
            description: "Experience luxury and power with the Toyota Land Cruiser V8. Perfect for both city drives and off-road adventures across Ghana. Fully loaded with premium features.",
            features: ["GPS Navigation", "Bluetooth", "Leather Seats", "Sunroof", "Backup Camera", "4WD"],
            ownerName: "Kwame Auto Rentals", ownerPhone: "+233244123456"),
        Car(id: "2", brand: "Mercedes", model: "E-Class 300", year: 2024, category: "Sedan",
            image: "mercedes_e_class_sedan",
            images: ["mercedes_e_class_sedan", "mercedes_e_class_sedan", "mercedes_e_class_sedan"],
            pricePerDay: 1200, pricePerWeek: 7500, location: "Airport Area", seats: 5,
            transmission: .automatic, fuelType: .petrol, horsepower: 255, hasAC: true,
            rating: 4.9, reviewCount: 89, isAvailable: true,
            description: "The Mercedes E-Class 300 offers unmatched elegance and comfort. Ideal for business meetings, airport transfers, and executive travel in Accra.",
            features: ["Ambient Lighting", "Heated Seats", "Premium Sound", "Wireless Charging", "Lane Assist"],
            ownerName: "Premium Drive GH", ownerPhone: "+233201234567"),
        Car(id: "3", brand: "BMW", model: "X5 xDrive", year: 2023, category: "SUV",
            image: "bmw_x5_blue_suv",
            images: ["bmw_x5_blue_suv", "bmw_x5_blue_suv", "bmw_x5_blue_suv"],
            pricePerDay: 950, pricePerWeek: 6000, location: "Cantonments", seats: 5,
            transmission: .automatic, fuelType: .diesel, horsepower: 335, hasAC: true,
            rating: 4.7, reviewCount: 67, isAvailable: true,
            description: "The BMW X5 combines sporty dynamics with luxury comfort. A powerful SUV that turns heads on the streets of Accra.",
            features: ["Panoramic Roof", "Gesture Control", "Harman Kardon Audio", "Adaptive Cruise", "Park Assist"],
            ownerName: "Accra Luxury Cars", ownerPhone: "+233551234567"),
        Car(id: "4", brand: "Range Rover", model: "Sport HSE", year: 2024, category: "SUV",
            image: "range_rover_sport_grey",
            images: ["range_rover_sport_grey", "range_rover_sport_grey"],
            pricePerDay: 1500, pricePerWeek: 9500, location: "East Legon", seats: 5,
            transmission: .automatic, fuelType: .petrol, horsepower: 395, hasAC: true,
            rating: 4.9, reviewCount: 43, isAvailable: true,
            description: "The Range Rover Sport HSE is the epitome of British luxury. Command the road with style and sophistication.",
            features: ["Terrain Response", "Meridian Audio", "Air Suspension", "Massage Seats", "HUD Display"],
            ownerName: "Royal Fleet GH", ownerPhone: "+233271234567"),
        Car(id: "5", brand: "Honda", model: "CR-V Touring", year: 2023, category: "SUV",
            image: "honda_crv_white_suv",
            images: ["honda_crv_white_suv"],
            pricePerDay: 450, pricePerWeek: 2800, location: "Tema", seats: 5,
            transmission: .automatic, fuelType: .petrol, horsepower: 190, hasAC: true,
            rating: 4.5, reviewCount: 156, isAvailable: true,
            description: "Reliable and fuel-efficient, the Honda CR-V is perfect for everyday drives and family trips around Greater Accra.",
            features: ["Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Remote Start"],
            ownerName: "GH Auto Hire", ownerPhone: "+233241234567"),
        Car(id: "6", brand: "Toyota", model: "Camry XSE", year: 2024, category: "Sedan",
            image: "toyota_camry_silver_sedan",
            images: ["toyota_camry_silver_sedan"],
            pricePerDay: 380, pricePerWeek: 2300, location: "Kumasi", seats: 5,
            transmission: .automatic, fuelType: .hybrid, horsepower: 206, hasAC: true,
            rating: 4.6, reviewCount: 203, isAvailable: true,
            description: "The Toyota Camry XSE offers a sporty ride with hybrid efficiency. A top choice for city commuting in Kumasi.",
            features: ["Hybrid Engine", "JBL Audio", "Wireless Charging", "Safety Sense 2.5"],
            ownerName: "Kumasi Car Rentals", ownerPhone: "+233261234567"),
        Car(id: "7", brand: "Hyundai", model: "Tucson N Line", year: 2023, category: "SUV",
            image: "hyundai_tucson_red_suv",
            images: ["hyundai_tucson_red_suv"],
            pricePerDay: 400, pricePerWeek: 2500, location: "Takoradi", seats: 5,
            transmission: .automatic, fuelType: .petrol, horsepower: 187, hasAC: true,
            rating: 4.4, reviewCount: 78, isAvailable: true,
            description: "The Hyundai Tucson N Line combines bold design with practicality. Great for exploring the Western Region.",
            features: ["Smart Key", "Bose Audio", "Ventilated Seats", "Digital Cluster"],
            ownerName: "Western Auto GH", ownerPhone: "+233231234567"),
        Car(id: "8", brand: "Audi", model: "Q7 Premium", year: 2024, category: "SUV",
            image: "audi_q7_suv",
            images: ["audi_q7_suv"],
            pricePerDay: 1100, pricePerWeek: 7000, location: "Osu", seats: 7,
            transmission: .automatic, fuelType: .diesel, horsepower: 335, hasAC: true,
            rating: 4.8, reviewCount: 34, isAvailable: false,
            description: "The Audi Q7 Premium is a statement of sophistication. Spacious, powerful, and packed with cutting-edge tech.",
            features: ["Virtual Cockpit", "Matrix LED", "Air Suspension", "Bang & Olufsen Audio", "Quattro AWD"],
            ownerName: "Elite Wheels Accra", ownerPhone: "+233501234567"),
    ]

    static let brands: [Brand] = [
        Brand(id: "1", name: "Toyota", logo: "https://www.carlogos.org/car-logos/toyota-logo-2020-europe.png", carCount: 24),
        Brand(id: "2", name: "Mercedes", logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo-2011.png", carCount: 18),
        Brand(id: "3", name: "BMW", logo: "https://www.carlogos.org/car-logos/bmw-logo-2020.png", carCount: 15),
        Brand(id: "4", name: "Range Rover", logo: "https://www.carlogos.org/car-logos/land-rover-logo.png", carCount: 12),
        Brand(id: "5", name: "Honda", logo: "https://www.carlogos.org/car-logos/honda-logo-2000.png", carCount: 20),
        Brand(id: "6", name: "Audi", logo: "https://www.carlogos.org/car-logos/audi-logo-2016.png", carCount: 10),
        Brand(id: "7", name: "Hyundai", logo: "https://www.carlogos.org/car-logos/hyundai-logo-2011.png", carCount: 16),
        Brand(id: "8", name: "Nissan", logo: "https://www.carlogos.org/car-logos/nissan-logo-2020.png", carCount: 14),
    ]

    static let bookings: [Booking] = [
        Booking(id: "b1", carId: "1", car: cars[0], pickupDate: "2026-03-28", returnDate: "2026-03-31",
                pickupLocation: "East Legon, Accra", totalDays: 3, totalPrice: 2550, status: .approved, createdAt: "2026-03-25"),
        Booking(id: "b2", carId: "2", car: cars[1], pickupDate: "2026-03-20", returnDate: "2026-03-22",
                pickupLocation: "Airport Area, Accra", totalDays: 2, totalPrice: 2400, status: .completed, createdAt: "2026-03-18"),
        Booking(id: "b3", carId: "5", car: cars[4], pickupDate: "2026-04-05", returnDate: "2026-04-10",
                pickupLocation: "Tema", totalDays: 5, totalPrice: 2250, status: .pending, createdAt: "2026-03-24"),
    ]

    static let user = UserProfile(id: "u1", name: "Kwaku Mensah", email: "kwaku.mensah@email.com",
        phone: "+233241234567", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
        isVerified: true, verificationStatus: .approved, totalBookings: 12, memberSince: "2025-06-15", role: .customer)

    static let fleetOwner = UserProfile(id: "u2", name: "Kofi Asante", email: "kofi.asante@fleetgh.com",
        phone: "+233244567890", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
        isVerified: true, verificationStatus: .approved, totalBookings: 0, memberSince: "2024-11-01", role: .fleetOwner)

    static let dealer = UserProfile(id: "u3", name: "Accra Premium Motors", email: "sales@accrapremium.com",
        phone: "+233201234567", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
        isVerified: true, verificationStatus: .approved, totalBookings: 0, memberSince: "2024-08-20", role: .dealership)

    static let admin = UserProfile(id: "u4", name: "Ama Owusu", email: "ama@autoride.gh",
        phone: "+233551234567", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
        isVerified: true, verificationStatus: .approved, totalBookings: 0, memberSince: "2024-01-01", role: .admin)

    static func profile(for role: UserRole) -> UserProfile {
        switch role {
        case .customer: return user
        case .fleetOwner: return fleetOwner
        case .dealership: return dealer
        case .admin: return admin
        }
    }

    static let fleetVehicles: [FleetVehicle] = [
        FleetVehicle(id: "fv1", carId: "1", car: cars[0], status: .rented, totalEarnings: 42500, totalTrips: 50, nextMaintenance: "2026-04-15"),
        FleetVehicle(id: "fv2", carId: "2", car: cars[1], status: .active, totalEarnings: 67200, totalTrips: 56, nextMaintenance: "2026-04-02"),
        FleetVehicle(id: "fv3", carId: "4", car: cars[3], status: .maintenance, totalEarnings: 89100, totalTrips: 61, nextMaintenance: "2026-03-28"),
        FleetVehicle(id: "fv4", carId: "6", car: cars[5], status: .active, totalEarnings: 28400, totalTrips: 75, nextMaintenance: "2026-05-10"),
    ]

    static let earnings = EarningsSummary(totalRevenue: 227200, thisMonth: 34500, lastMonth: 29800,
        pendingPayouts: 8200, completedTrips: 242, activeRentals: 2)

    static let dealerListings: [DealerListing] = [
        DealerListing(id: "dl1", car: cars[0], listingType: .featured, askingPrice: 285000, views: 1243, leads: 18, status: .active, createdAt: "2026-02-15"),
        DealerListing(id: "dl2", car: cars[1], listingType: .sale, askingPrice: 420000, views: 876, leads: 12, status: .active, createdAt: "2026-03-01"),
        DealerListing(id: "dl3", car: cars[2], listingType: .featured, askingPrice: 310000, views: 654, leads: 8, status: .sold, createdAt: "2026-01-20"),
        DealerListing(id: "dl4", car: cars[4], listingType: .sale, askingPrice: 145000, views: 432, leads: 22, status: .active, createdAt: "2026-03-10"),
    ]

    static let leads: [Lead] = [
        Lead(id: "l1", customerName: "Yaw Boateng", customerPhone: "+233241111111", carModel: "Toyota Land Cruiser V8", message: "Is the price negotiable? I can pay cash.", status: .new, createdAt: "2026-03-24"),
        Lead(id: "l2", customerName: "Abena Serwaa", customerPhone: "+233242222222", carModel: "Mercedes E-Class 300", message: "Can I schedule a test drive this weekend?", status: .contacted, createdAt: "2026-03-23"),
        Lead(id: "l3", customerName: "Kwesi Appiah", customerPhone: "+233243333333", carModel: "Honda CR-V Touring", message: "Do you offer financing options?", status: .new, createdAt: "2026-03-25"),
        Lead(id: "l4", customerName: "Efua Mensah", customerPhone: "+233244444444", carModel: "BMW X5 xDrive", message: "Purchased! Thank you for the smooth process.", status: .converted, createdAt: "2026-03-20"),
    ]

    static let adminUsers: [AdminUser] = [
        AdminUser(id: "au1", name: "Kwaku Mensah", email: "kwaku@email.com", role: .customer, status: .active, joinDate: "2025-06-15", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"),
        AdminUser(id: "au2", name: "Kofi Asante", email: "kofi@fleetgh.com", role: .fleetOwner, status: .active, joinDate: "2024-11-01", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"),
        AdminUser(id: "au3", name: "Accra Premium Motors", email: "sales@accrapremium.com", role: .dealership, status: .active, joinDate: "2024-08-20", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80"),
        AdminUser(id: "au4", name: "Nana Adjei", email: "nana@email.com", role: .customer, status: .pendingKyc, joinDate: "2026-03-22", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80"),
        AdminUser(id: "au5", name: "Akosua Darko", email: "akosua@email.com", role: .customer, status: .pendingKyc, joinDate: "2026-03-24", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"),
        AdminUser(id: "au6", name: "Golden Auto Sales", email: "info@goldenauto.com", role: .dealership, status: .suspended, joinDate: "2025-05-10", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80"),
    ]

    static let adminStats = AdminStats(totalUsers: 2847, totalBookings: 1523, totalRevenue: 4250000,
        activeListings: 342, pendingKYC: 23, monthlyGrowth: 12.4)

    static let kycDocuments: [KYCDocument] = [
        KYCDocument(id: "kyc1", type: .ghanaCard, label: "Ghana Card", status: .verified, uploadedAt: "2025-12-01"),
        KYCDocument(id: "kyc2", type: .driversLicense, label: "Driver's License", status: .uploaded, uploadedAt: "2026-01-15"),
        KYCDocument(id: "kyc3", type: .passport, label: "Passport", status: .notUploaded, uploadedAt: nil),
        KYCDocument(id: "kyc4", type: .selfie, label: "Selfie Verification", status: .notUploaded, uploadedAt: nil),
    ]

    static let saleCars: [SaleCar] = [
        SaleCar(id: "s1", brand: "Toyota", model: "Highlander XLE", year: 2022, category: "SUV",
            image: "toyota_highlander_suv",
            images: ["toyota_highlander_suv"],
            salePrice: 195000, mileage: 34000, location: "East Legon", fuelType: .petrol, transmission: .automatic,
            condition: .foreignUsed, dealerName: "Accra Premium Motors", dealerPhone: "+233201234567",
            dealerAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80", isFeatured: true, views: 892,
            description: "Well-maintained Toyota Highlander XLE with panoramic sunroof, leather seats, and premium JBL audio.",
            features: ["Panoramic Sunroof", "Leather Seats", "JBL Audio", "Blind Spot Monitor", "Apple CarPlay"]),
        SaleCar(id: "s2", brand: "Mercedes", model: "GLC 300 4MATIC", year: 2023, category: "SUV",
            image: "mercedes_glc_300_suv",
            images: ["mercedes_glc_300_suv"],
            salePrice: 380000, mileage: 12000, location: "Airport Area", fuelType: .petrol, transmission: .automatic,
            condition: .foreignUsed, dealerName: "Premium Drive GH", dealerPhone: "+233201234567",
            dealerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", isFeatured: true, views: 1245,
            description: "Stunning Mercedes GLC 300 in pristine condition. Low mileage, fully loaded with AMG package.",
            features: ["AMG Package", "Burmester Audio", "Ambient Lighting", "360 Camera", "Heated Seats"]),
        SaleCar(id: "s3", brand: "Honda", model: "Accord Sport", year: 2021, category: "Sedan",
            image: "honda_accord_sedan",
            images: ["honda_accord_sedan"],
            salePrice: 135000, mileage: 48000, location: "Tema", fuelType: .petrol, transmission: .automatic,
            condition: .foreignUsed, dealerName: "GH Auto Sales", dealerPhone: "+233241234567",
            dealerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80", isFeatured: false, views: 567,
            description: "Reliable Honda Accord Sport with great fuel economy. Perfect for daily commuting.",
            features: ["Adaptive Cruise", "Lane Keep Assist", "Apple CarPlay", "Remote Start"]),
        SaleCar(id: "s4", brand: "BMW", model: "X3 M40i", year: 2024, category: "SUV",
            image: "bmw_x3_m40i_front_angle",
            images: ["bmw_x3_m40i_front_angle"],
            salePrice: 420000, mileage: 5000, location: "Cantonments", fuelType: .petrol, transmission: .automatic,
            condition: .new, dealerName: "Elite Wheels Accra", dealerPhone: "+233501234567",
            dealerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80", isFeatured: true, views: 2134,
            description: "Brand new BMW X3 M40i with M Sport package. Incredible performance and luxury combined.",
            features: ["M Sport Package", "Harman Kardon", "Panoramic Roof", "Gesture Control", "Head-Up Display"]),
        SaleCar(id: "s5", brand: "Hyundai", model: "Elantra N", year: 2023, category: "Sedan",
            image: "hyundai_elantra_n_sedan",
            images: ["hyundai_elantra_n_sedan"],
            salePrice: 98000, mileage: 22000, location: "Kumasi", fuelType: .petrol, transmission: .manual,
            condition: .foreignUsed, dealerName: "Kumasi Auto Hub", dealerPhone: "+233261234567",
            dealerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", isFeatured: false, views: 345,
            description: "Sporty Hyundai Elantra N with manual transmission. Fun to drive with great tech features.",
            features: ["Sport Seats", "Bose Audio", "Digital Cluster", "N Mode", "Performance Exhaust"]),
        SaleCar(id: "s6", brand: "Range Rover", model: "Velar R-Dynamic", year: 2023, category: "SUV",
            image: "range_rover_velar_green",
            images: ["range_rover_velar_green"],
            salePrice: 365000, mileage: 18000, location: "East Legon", fuelType: .diesel, transmission: .automatic,
            condition: .foreignUsed, dealerName: "Royal Fleet GH", dealerPhone: "+233271234567",
            dealerAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80", isFeatured: true, views: 1567,
            description: "Elegant Range Rover Velar with R-Dynamic styling. A statement of luxury and sophistication.",
            features: ["Meridian Audio", "Air Suspension", "Touch Pro Duo", "Matrix LED", "Terrain Response"]),
    ]

    static let paymentMethods: [PaymentMethod] = [
        PaymentMethod(id: "pm1", type: .momoMtn, label: "MTN Mobile Money", icon: "🟡", details: "024 •••• 567"),
        PaymentMethod(id: "pm2", type: .momoVodafone, label: "Vodafone Cash", icon: "🔴", details: "020 •••• 890"),
        PaymentMethod(id: "pm3", type: .momoAirteltigo, label: "AirtelTigo Money", icon: "🔵", details: nil),
        PaymentMethod(id: "pm4", type: .card, label: "Visa •••• 4532", icon: "💳", details: "Expires 12/27"),
        PaymentMethod(id: "pm5", type: .wallet, label: "AutoRide Wallet", icon: "👛", details: "GH₵ 2,450.00"),
    ]

    static let wallet = WalletInfo(balance: 2450, currency: "GH₵", transactions: [
        WalletTransaction(id: "wt1", type: .credit, amount: 5000, description: "Wallet top-up via MTN MoMo", date: "2026-03-24", status: .completed),
        WalletTransaction(id: "wt2", type: .debit, amount: 2550, description: "Toyota Land Cruiser V8 — 3 days", date: "2026-03-22", status: .completed),
        WalletTransaction(id: "wt3", type: .credit, amount: 1200, description: "Refund — Mercedes E-Class cancelled", date: "2026-03-20", status: .completed),
        WalletTransaction(id: "wt4", type: .debit, amount: 850, description: "Honda CR-V Touring — 1 day", date: "2026-03-18", status: .completed),
        WalletTransaction(id: "wt5", type: .credit, amount: 3000, description: "Wallet top-up via Visa card", date: "2026-03-15", status: .completed),
        WalletTransaction(id: "wt6", type: .debit, amount: 450, description: "Service fee", date: "2026-03-14", status: .pending),
    ])

    static let notifications: [AppNotification] = [
        AppNotification(id: "n1", type: .booking, title: "Booking Confirmed", message: "Your Toyota Land Cruiser V8 booking for Mar 28–31 has been approved.", timestamp: "2026-03-25T10:30:00", isRead: false, actionCarId: "1"),
        AppNotification(id: "n2", type: .payment, title: "Payment Received", message: "GH₵ 5,000 has been added to your wallet via MTN Mobile Money.", timestamp: "2026-03-24T14:15:00", isRead: false, actionCarId: nil),
        AppNotification(id: "n3", type: .promo, title: "20% Off Weekend Rides!", message: "Book any SUV this weekend and save 20%. Use code WEEKEND20 at checkout.", timestamp: "2026-03-23T09:00:00", isRead: true, actionCarId: nil),
        AppNotification(id: "n4", type: .kyc, title: "Verification Update", message: "Your driver's license has been uploaded successfully. We'll review it within 24 hours.", timestamp: "2026-03-22T16:45:00", isRead: true, actionCarId: nil),
        AppNotification(id: "n5", type: .booking, title: "Return Reminder", message: "Your Mercedes E-Class rental ends tomorrow at 10:00 AM. Please return to Airport Area.", timestamp: "2026-03-21T18:00:00", isRead: true, actionCarId: nil),
        AppNotification(id: "n6", type: .system, title: "Welcome to AutoRide!", message: "Your account has been created. Complete your KYC to start renting cars.", timestamp: "2026-03-20T08:00:00", isRead: true, actionCarId: nil),
        AppNotification(id: "n7", type: .payment, title: "Refund Processed", message: "GH₵ 1,200 has been refunded for your cancelled Mercedes E-Class booking.", timestamp: "2026-03-20T12:30:00", isRead: true, actionCarId: nil),
        AppNotification(id: "n8", type: .promo, title: "New: Car Sales Marketplace!", message: "Browse premium cars for sale from verified dealers across Ghana.", timestamp: "2026-03-19T10:00:00", isRead: true, actionCarId: nil),
    ]
}
