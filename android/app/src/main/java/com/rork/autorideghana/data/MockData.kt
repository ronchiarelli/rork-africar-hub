package com.rork.autorideghana.data

object MockData {

    val locations = listOf(
        "Accra", "Kumasi", "Tema", "Takoradi", "Cape Coast",
        "Tamale", "East Legon", "Airport Area", "Cantonments", "Osu"
    )

    private const val BASE = "https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets"

    val cars: List<Car> = listOf(
        Car(
            id = "1", brand = "Toyota", model = "Land Cruiser V8", year = 2023, category = "SUV",
            image = "$BASE/7b981aba-e063-4ecf-9970-305eda1eafb4.png",
            images = listOf(
                "$BASE/7b981aba-e063-4ecf-9970-305eda1eafb4.png",
                "$BASE/7b981aba-e063-4ecf-9970-305eda1eafb4.png",
                "$BASE/7b981aba-e063-4ecf-9970-305eda1eafb4.png",
            ),
            pricePerDay = 850, pricePerWeek = 5200, location = "East Legon", seats = 7,
            transmission = "Automatic", fuelType = "Diesel", horsepower = 304, hasAC = true,
            rating = 4.8, reviewCount = 124, isAvailable = true,
            description = "Experience luxury and power with the Toyota Land Cruiser V8. Perfect for both city drives and off-road adventures across Ghana. Fully loaded with premium features.",
            features = listOf("GPS Navigation", "Bluetooth", "Leather Seats", "Sunroof", "Backup Camera", "4WD"),
            ownerName = "Kwame Auto Rentals", ownerPhone = "+233244123456",
        ),
        Car(
            id = "2", brand = "Mercedes", model = "E-Class 300", year = 2024, category = "Sedan",
            image = "$BASE/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png",
            images = listOf(
                "$BASE/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png",
                "$BASE/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png",
                "$BASE/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png",
            ),
            pricePerDay = 1200, pricePerWeek = 7500, location = "Airport Area", seats = 5,
            transmission = "Automatic", fuelType = "Petrol", horsepower = 255, hasAC = true,
            rating = 4.9, reviewCount = 89, isAvailable = true,
            description = "The Mercedes E-Class 300 offers unmatched elegance and comfort. Ideal for business meetings, airport transfers, and executive travel in Accra.",
            features = listOf("Ambient Lighting", "Heated Seats", "Premium Sound", "Wireless Charging", "Lane Assist"),
            ownerName = "Premium Drive GH", ownerPhone = "+233201234567",
        ),
        Car(
            id = "3", brand = "BMW", model = "X5 xDrive", year = 2023, category = "SUV",
            image = "$BASE/54b67d0f-cc42-46cf-b7d2-00599786fe11.png",
            images = listOf(
                "$BASE/54b67d0f-cc42-46cf-b7d2-00599786fe11.png",
                "$BASE/54b67d0f-cc42-46cf-b7d2-00599786fe11.png",
                "$BASE/54b67d0f-cc42-46cf-b7d2-00599786fe11.png",
            ),
            pricePerDay = 950, pricePerWeek = 6000, location = "Cantonments", seats = 5,
            transmission = "Automatic", fuelType = "Diesel", horsepower = 335, hasAC = true,
            rating = 4.7, reviewCount = 67, isAvailable = true,
            description = "The BMW X5 combines sporty dynamics with luxury comfort. A powerful SUV that turns heads on the streets of Accra.",
            features = listOf("Panoramic Roof", "Gesture Control", "Harman Kardon Audio", "Adaptive Cruise", "Park Assist"),
            ownerName = "Accra Luxury Cars", ownerPhone = "+233551234567",
        ),
        Car(
            id = "4", brand = "Range Rover", model = "Sport HSE", year = 2024, category = "SUV",
            image = "$BASE/f6af0402-76ca-4152-a7b7-50bf169ed9a0.png",
            images = listOf(
                "$BASE/f6af0402-76ca-4152-a7b7-50bf169ed9a0.png",
                "$BASE/f6af0402-76ca-4152-a7b7-50bf169ed9a0.png",
            ),
            pricePerDay = 1500, pricePerWeek = 9500, location = "East Legon", seats = 5,
            transmission = "Automatic", fuelType = "Petrol", horsepower = 395, hasAC = true,
            rating = 4.9, reviewCount = 43, isAvailable = true,
            description = "The Range Rover Sport HSE is the epitome of British luxury. Command the road with style and sophistication.",
            features = listOf("Terrain Response", "Meridian Audio", "Air Suspension", "Massage Seats", "HUD Display"),
            ownerName = "Royal Fleet GH", ownerPhone = "+233271234567",
        ),
        Car(
            id = "5", brand = "Honda", model = "CR-V Touring", year = 2023, category = "SUV",
            image = "$BASE/0d40a077-f222-47b2-bd76-c5000e877e96.png",
            images = listOf("$BASE/0d40a077-f222-47b2-bd76-c5000e877e96.png"),
            pricePerDay = 450, pricePerWeek = 2800, location = "Tema", seats = 5,
            transmission = "Automatic", fuelType = "Petrol", horsepower = 190, hasAC = true,
            rating = 4.5, reviewCount = 156, isAvailable = true,
            description = "Reliable and fuel-efficient, the Honda CR-V is perfect for everyday drives and family trips around Greater Accra.",
            features = listOf("Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Remote Start"),
            ownerName = "GH Auto Hire", ownerPhone = "+233241234567",
        ),
        Car(
            id = "6", brand = "Toyota", model = "Camry XSE", year = 2024, category = "Sedan",
            image = "$BASE/d3db8785-fcfe-4c40-8a04-6c812f7265de.png",
            images = listOf("$BASE/d3db8785-fcfe-4c40-8a04-6c812f7265de.png"),
            pricePerDay = 380, pricePerWeek = 2300, location = "Kumasi", seats = 5,
            transmission = "Automatic", fuelType = "Hybrid", horsepower = 206, hasAC = true,
            rating = 4.6, reviewCount = 203, isAvailable = true,
            description = "The Toyota Camry XSE offers a sporty ride with hybrid efficiency. A top choice for city commuting in Kumasi.",
            features = listOf("Hybrid Engine", "JBL Audio", "Wireless Charging", "Safety Sense 2.5"),
            ownerName = "Kumasi Car Rentals", ownerPhone = "+233261234567",
        ),
        Car(
            id = "7", brand = "Hyundai", model = "Tucson N Line", year = 2023, category = "SUV",
            image = "$BASE/d7ce3762-de3f-4607-b2db-997fc2e66dc7.png",
            images = listOf("$BASE/d7ce3762-de3f-4607-b2db-997fc2e66dc7.png"),
            pricePerDay = 400, pricePerWeek = 2500, location = "Takoradi", seats = 5,
            transmission = "Automatic", fuelType = "Petrol", horsepower = 187, hasAC = true,
            rating = 4.4, reviewCount = 78, isAvailable = true,
            description = "The Hyundai Tucson N Line combines bold design with practicality. Great for exploring the Western Region.",
            features = listOf("Smart Key", "Bose Audio", "Ventilated Seats", "Digital Cluster"),
            ownerName = "Western Auto GH", ownerPhone = "+233231234567",
        ),
        Car(
            id = "8", brand = "Audi", model = "Q7 Premium", year = 2024, category = "SUV",
            image = "$BASE/7b11b293-7b4c-4bcf-b00e-b66a78a92ab3.png",
            images = listOf("$BASE/7b11b293-7b4c-4bcf-b00e-b66a78a92ab3.png"),
            pricePerDay = 1100, pricePerWeek = 7000, location = "Osu", seats = 7,
            transmission = "Automatic", fuelType = "Diesel", horsepower = 335, hasAC = true,
            rating = 4.8, reviewCount = 34, isAvailable = false,
            description = "The Audi Q7 Premium is a statement of sophistication. Spacious, powerful, and packed with cutting-edge tech.",
            features = listOf("Virtual Cockpit", "Matrix LED", "Air Suspension", "Bang & Olufsen Audio", "Quattro AWD"),
            ownerName = "Elite Wheels Accra", ownerPhone = "+233501234567",
        ),
    )

    val brands: List<Brand> = listOf(
        Brand("1", "Toyota", "https://www.carlogos.org/car-logos/toyota-logo-2020-europe.png", 24),
        Brand("2", "Mercedes", "https://www.carlogos.org/car-logos/mercedes-benz-logo-2011.png", 18),
        Brand("3", "BMW", "https://www.carlogos.org/car-logos/bmw-logo-2020.png", 15),
        Brand("4", "Range Rover", "https://www.carlogos.org/car-logos/land-rover-logo.png", 12),
        Brand("5", "Honda", "https://www.carlogos.org/car-logos/honda-logo-2000.png", 20),
        Brand("6", "Audi", "https://www.carlogos.org/car-logos/audi-logo-2016.png", 10),
        Brand("7", "Hyundai", "https://www.carlogos.org/car-logos/hyundai-logo-2011.png", 16),
        Brand("8", "Nissan", "https://www.carlogos.org/car-logos/nissan-logo-2020.png", 14),
    )

    val bookings: List<Booking> = listOf(
        Booking("b1", cars[0], "2026-03-28", "2026-03-31", "East Legon, Accra", 3, 2550, BookingStatus.APPROVED, "2026-03-25"),
        Booking("b2", cars[1], "2026-03-20", "2026-03-22", "Airport Area, Accra", 2, 2400, BookingStatus.COMPLETED, "2026-03-18"),
        Booking("b3", cars[4], "2026-04-05", "2026-04-10", "Tema", 5, 2250, BookingStatus.PENDING, "2026-03-24"),
    )

    val customer = UserProfile("u1", "Kwaku Mensah", "kwaku.mensah@email.com", "+233241234567",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", true, "approved", 12, "2025-06-15", UserRole.CUSTOMER)
    val fleetOwner = UserProfile("u2", "Kofi Asante", "kofi.asante@fleetgh.com", "+233244567890",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", true, "approved", 0, "2024-11-01", UserRole.FLEET_OWNER)
    val dealer = UserProfile("u3", "Accra Premium Motors", "sales@accrapremium.com", "+233201234567",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80", true, "approved", 0, "2024-08-20", UserRole.DEALERSHIP)
    val admin = UserProfile("u4", "Ama Owusu", "ama@autoride.gh", "+233551234567",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", true, "approved", 0, "2024-01-01", UserRole.ADMIN)

    fun profileForRole(role: UserRole): UserProfile = when (role) {
        UserRole.CUSTOMER -> customer
        UserRole.FLEET_OWNER -> fleetOwner
        UserRole.DEALERSHIP -> dealer
        UserRole.ADMIN -> admin
    }

    val fleetVehicles: List<FleetVehicle> = listOf(
        FleetVehicle("fv1", cars[0], FleetStatus.RENTED, 42500, 50, "2026-04-15"),
        FleetVehicle("fv2", cars[1], FleetStatus.ACTIVE, 67200, 56, "2026-04-02"),
        FleetVehicle("fv3", cars[3], FleetStatus.MAINTENANCE, 89100, 61, "2026-03-28"),
        FleetVehicle("fv4", cars[5], FleetStatus.ACTIVE, 28400, 75, "2026-05-10"),
    )

    val earnings = EarningsSummary(227200, 34500, 29800, 8200, 242, 2)

    val dealerListings: List<DealerListing> = listOf(
        DealerListing("dl1", cars[0], "featured", 285000, 1243, 18, "active", "2026-02-15"),
        DealerListing("dl2", cars[1], "sale", 420000, 876, 12, "active", "2026-03-01"),
        DealerListing("dl3", cars[2], "featured", 310000, 654, 8, "sold", "2026-01-20"),
        DealerListing("dl4", cars[4], "sale", 145000, 432, 22, "active", "2026-03-10"),
    )

    val leads: List<Lead> = listOf(
        Lead("l1", "Yaw Boateng", "+233241111111", "Toyota Land Cruiser V8", "Is the price negotiable? I can pay cash.", "new", "2026-03-24"),
        Lead("l2", "Abena Serwaa", "+233242222222", "Mercedes E-Class 300", "Can I schedule a test drive this weekend?", "contacted", "2026-03-23"),
        Lead("l3", "Kwesi Appiah", "+233243333333", "Honda CR-V Touring", "Do you offer financing options?", "new", "2026-03-25"),
        Lead("l4", "Efua Mensah", "+233244444444", "BMW X5 xDrive", "Purchased! Thank you for the smooth process.", "converted", "2026-03-20"),
    )

    val adminUsers: List<AdminUser> = listOf(
        AdminUser("au1", "Kwaku Mensah", "kwaku@email.com", UserRole.CUSTOMER, "active", "2025-06-15", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"),
        AdminUser("au2", "Kofi Asante", "kofi@fleetgh.com", UserRole.FLEET_OWNER, "active", "2024-11-01", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"),
        AdminUser("au3", "Accra Premium Motors", "sales@accrapremium.com", UserRole.DEALERSHIP, "active", "2024-08-20", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80"),
        AdminUser("au4", "Nana Adjei", "nana@email.com", UserRole.CUSTOMER, "pending_kyc", "2026-03-22", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80"),
        AdminUser("au5", "Akosua Darko", "akosua@email.com", UserRole.CUSTOMER, "pending_kyc", "2026-03-24", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"),
        AdminUser("au6", "Golden Auto Sales", "info@goldenauto.com", UserRole.DEALERSHIP, "suspended", "2025-05-10", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80"),
    )

    val adminStats = AdminStats(2847, 1523, 4250000, 342, 23, 12.4)

    val kycDocuments: List<KYCDocument> = listOf(
        KYCDocument("kyc1", "ghana_card", "Ghana Card", "verified", "2025-12-01"),
        KYCDocument("kyc2", "drivers_license", "Driver's License", "uploaded", "2026-01-15"),
        KYCDocument("kyc3", "passport", "Passport", "not_uploaded"),
        KYCDocument("kyc4", "selfie", "Selfie Verification", "not_uploaded"),
    )

    val saleCars: List<SaleCar> = listOf(
        SaleCar("s1", "Toyota", "Highlander XLE", 2022, "SUV",
            "$BASE/52f66c7b-2ed2-44c6-8c59-e604db1d71cd.png",
            listOf("$BASE/52f66c7b-2ed2-44c6-8c59-e604db1d71cd.png"),
            195000, 34000, "East Legon", "Petrol", "Automatic", "Foreign Used",
            "Accra Premium Motors", "+233201234567", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
            true, 892, "Well-maintained Toyota Highlander XLE with panoramic sunroof, leather seats, and premium JBL audio.",
            listOf("Panoramic Sunroof", "Leather Seats", "JBL Audio", "Blind Spot Monitor", "Apple CarPlay")),
        SaleCar("s2", "Mercedes", "GLC 300 4MATIC", 2023, "SUV",
            "$BASE/76f9b361-67b9-47cd-a4f3-ebcbff45bbe1.png",
            listOf("$BASE/76f9b361-67b9-47cd-a4f3-ebcbff45bbe1.png"),
            380000, 12000, "Airport Area", "Petrol", "Automatic", "Foreign Used",
            "Premium Drive GH", "+233201234567", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
            true, 1245, "Stunning Mercedes GLC 300 in pristine condition. Low mileage, fully loaded with AMG package.",
            listOf("AMG Package", "Burmester Audio", "Ambient Lighting", "360 Camera", "Heated Seats")),
        SaleCar("s3", "Honda", "Accord Sport", 2021, "Sedan",
            "$BASE/c094c615-9ce9-426d-8714-c275297becad.png",
            listOf("$BASE/c094c615-9ce9-426d-8714-c275297becad.png"),
            135000, 48000, "Tema", "Petrol", "Automatic", "Foreign Used",
            "GH Auto Sales", "+233241234567", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
            false, 567, "Reliable Honda Accord Sport with great fuel economy. Perfect for daily commuting.",
            listOf("Adaptive Cruise", "Lane Keep Assist", "Apple CarPlay", "Remote Start")),
        SaleCar("s4", "BMW", "X3 M40i", 2024, "SUV",
            "$BASE/fcf97e22-e677-4dbd-af5a-f23718039bbe.png",
            listOf("$BASE/fcf97e22-e677-4dbd-af5a-f23718039bbe.png"),
            420000, 5000, "Cantonments", "Petrol", "Automatic", "New",
            "Elite Wheels Accra", "+233501234567", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80",
            true, 2134, "Brand new BMW X3 M40i with M Sport package. Incredible performance and luxury combined.",
            listOf("M Sport Package", "Harman Kardon", "Panoramic Roof", "Gesture Control", "Head-Up Display")),
        SaleCar("s5", "Hyundai", "Elantra N", 2023, "Sedan",
            "$BASE/1a183bc3-adcf-409e-9298-722f682c075a.png",
            listOf("$BASE/1a183bc3-adcf-409e-9298-722f682c075a.png"),
            98000, 22000, "Kumasi", "Petrol", "Manual", "Foreign Used",
            "Kumasi Auto Hub", "+233261234567", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
            false, 345, "Sporty Hyundai Elantra N with manual transmission. Fun to drive with great tech features.",
            listOf("Sport Seats", "Bose Audio", "Digital Cluster", "N Mode", "Performance Exhaust")),
        SaleCar("s6", "Range Rover", "Velar R-Dynamic", 2023, "SUV",
            "$BASE/5faa9cb4-a2a6-4ce2-8317-66f4d0cf6a21.png",
            listOf("$BASE/5faa9cb4-a2a6-4ce2-8317-66f4d0cf6a21.png"),
            365000, 18000, "East Legon", "Diesel", "Automatic", "Foreign Used",
            "Royal Fleet GH", "+233271234567", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
            true, 1567, "Elegant Range Rover Velar with R-Dynamic styling. A statement of luxury and sophistication.",
            listOf("Meridian Audio", "Air Suspension", "Touch Pro Duo", "Matrix LED", "Terrain Response")),
    )

    val paymentMethods: List<PaymentMethod> = listOf(
        PaymentMethod("pm1", "momo_mtn", "MTN Mobile Money", "🟡", "024 •••• 567"),
        PaymentMethod("pm2", "momo_vodafone", "Vodafone Cash", "🔴", "020 •••• 890"),
        PaymentMethod("pm3", "momo_airteltigo", "AirtelTigo Money", "🔵"),
        PaymentMethod("pm4", "card", "Visa •••• 4532", "💳", "Expires 12/27"),
        PaymentMethod("pm5", "wallet", "AutoRide Wallet", "👛", "GH₵ 2,450.00"),
    )

    val wallet = WalletInfo(2450, "GH₵", listOf(
        WalletTransaction("wt1", "credit", 5000, "Wallet top-up via MTN MoMo", "2026-03-24", "completed"),
        WalletTransaction("wt2", "debit", 2550, "Toyota Land Cruiser V8 — 3 days", "2026-03-22", "completed"),
        WalletTransaction("wt3", "credit", 1200, "Refund — Mercedes E-Class cancelled", "2026-03-20", "completed"),
        WalletTransaction("wt4", "debit", 850, "Honda CR-V Touring — 1 day", "2026-03-18", "completed"),
        WalletTransaction("wt5", "credit", 3000, "Wallet top-up via Visa card", "2026-03-15", "completed"),
        WalletTransaction("wt6", "debit", 450, "Service fee", "2026-03-14", "pending"),
    ))

    val notifications: List<AppNotification> = listOf(
        AppNotification("n1", "booking", "Booking Confirmed", "Your Toyota Land Cruiser V8 booking for Mar 28–31 has been approved.", "2h ago", false),
        AppNotification("n2", "payment", "Payment Received", "GH₵ 5,000 has been added to your wallet via MTN Mobile Money.", "5h ago", false),
        AppNotification("n3", "promo", "20% Off Weekend Rides!", "Book any SUV this weekend and save 20%. Use code WEEKEND20 at checkout.", "1d ago", true),
        AppNotification("n4", "kyc", "Verification Update", "Your driver's license has been uploaded successfully. We'll review it within 24 hours.", "2d ago", true),
        AppNotification("n5", "booking", "Return Reminder", "Your Mercedes E-Class rental ends tomorrow at 10:00 AM. Please return to Airport Area.", "3d ago", true),
        AppNotification("n6", "system", "Welcome to AutoRide!", "Your account has been created. Complete your KYC to start renting cars.", "4d ago", true),
        AppNotification("n7", "payment", "Refund Processed", "GH₵ 1,200 has been refunded for your cancelled Mercedes E-Class booking.", "4d ago", true),
        AppNotification("n8", "promo", "New: Car Sales Marketplace!", "Browse premium cars for sale from verified dealers across Ghana.", "5d ago", true),
    )

    fun carById(id: String?): Car = cars.firstOrNull { it.id == id } ?: cars[0]
    fun saleCarById(id: String?): SaleCar = saleCars.firstOrNull { it.id == id } ?: saleCars[0]
    fun bookingById(id: String?): Booking = bookings.firstOrNull { it.id == id } ?: bookings[0]
}
