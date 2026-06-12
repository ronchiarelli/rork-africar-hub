import SwiftUI

/// Role-aware dashboard — shows the appropriate dashboard for the current user role.
struct DashboardView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @Binding var selectedTab: Int

    var body: some View {
        VStack(spacing: 0) {
            header
            switch app.currentRole {
            case .fleetOwner: fleetDashboard
            case .dealership: dealerDashboard
            case .admin: adminDashboard
            case .customer: customerDashboard
            }
        }
        .background(Theme.gray50)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Dashboard").font(.system(size: 28, weight: .heavy)).foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 60)
        .padding(.bottom, 20)
        .background(Theme.purpleDeep.ignoresSafeArea(edges: .top))
    }

    // MARK: - Fleet Owner

    private var fleetDashboard: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                revenueCard
                fleetStatsRow
                VStack(alignment: .leading, spacing: 12) {
                    Text("My Fleet").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(MockData.fleetVehicles) { vehicle in
                        fleetCard(vehicle)
                    }
                }
            }
            .padding(20)
        }
    }

    private var revenueCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Total Revenue").font(.system(size: 14)).foregroundStyle(.white.opacity(0.7))
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("GH₵").font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.orange)
                Text(formattedAmount(MockData.earnings.totalRevenue)).font(.system(size: 36, weight: .heavy)).foregroundStyle(.white)
            }
            HStack(spacing: 16) {
                miniStat("This Month", MockData.earnings.thisMonth, Theme.success)
                miniStat("Pending", MockData.earnings.pendingPayouts, Theme.orange)
            }
            .padding(.top, 6)
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 18))
    }

    private func miniStat(_ title: String, _ value: Int, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.system(size: 11)).foregroundStyle(.white.opacity(0.6))
            Text("GH₵ \(formattedAmount(value))").font(.system(size: 15, weight: .bold)).foregroundStyle(color)
        }
    }

    private var fleetStatsRow: some View {
        HStack(spacing: 10) {
            statCard("Trips", "\(MockData.earnings.completedTrips)", Theme.info, "calendar.badge.checkmark")
            statCard("Active", "\(MockData.earnings.activeRentals)", Theme.success, "car.fill")
            statCard("Service", "\(MockData.fleetVehicles.filter { $0.status == .maintenance }.count)", Theme.warning, "wrench.fill")
        }
    }

    private func statCard(_ label: String, _ value: String, _ color: Color, _ icon: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(color)
            Text(value).font(.system(size: 20, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 1)
    }

    private func fleetCard(_ vehicle: FleetVehicle) -> some View {
        HStack(spacing: 0) {
            Color.clear.frame(width: 90, height: 90)
                .overlay { RemoteImage(url: vehicle.car.image).allowsHitTesting(false) }
                .clipped()
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(vehicle.car.brand).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.gray500)
                        Text(vehicle.car.model).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                    }
                    Spacer()
                    statusChip(vehicle.status)
                }
                HStack(spacing: 4) {
                    Text("GH₵ \(formattedAmount(vehicle.totalEarnings)) earned").font(.system(size: 12)).foregroundStyle(Theme.gray600)
                    Text("·").foregroundStyle(Theme.gray400)
                    Text("\(vehicle.totalTrips) trips").font(.system(size: 12)).foregroundStyle(Theme.gray600)
                }
                if vehicle.status == .maintenance {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 10)).foregroundStyle(Theme.warning)
                        Text("Next service: \(vehicle.nextMaintenance)").font(.system(size: 11)).foregroundStyle(Theme.warning)
                    }
                }
            }
            .padding(12)
        }
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 1)
    }

    private func statusChip(_ status: FleetStatus) -> some View {
        let config: (Color, Color, String) = {
            switch status {
            case .active: return (Theme.success.opacity(0.12), Theme.success, "Available")
            case .rented: return (Theme.info.opacity(0.12), Theme.info, "Rented")
            case .maintenance: return (Theme.warning.opacity(0.12), Theme.warning, "Maintenance")
            case .inactive: return (Theme.gray200, Theme.gray600, "Inactive")
            }
        }()
        return Text(config.2).font(.system(size: 10, weight: .bold)).foregroundStyle(config.1)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(config.0, in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Dealer

    private var dealerDashboard: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                HStack(spacing: 10) {
                    statCard("Views", "\(MockData.dealerListings.reduce(0) { $0 + $1.views })", Theme.info, "eye.fill")
                    statCard("Leads", "\(MockData.leads.count)", Theme.success, "phone.fill")
                    statCard("Active", "\(MockData.dealerListings.filter { $0.status == .active }.count)", Theme.orange, "car.fill")
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text("My Listings").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(MockData.dealerListings) { listing in dealerListingCard(listing) }
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Leads").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(MockData.leads.prefix(5)) { lead in leadCard(lead) }
                }
            }
            .padding(20)
        }
    }

    private func dealerListingCard(_ listing: DealerListing) -> some View {
        HStack(spacing: 0) {
            Color.clear.frame(width: 90, height: 90)
                .overlay { RemoteImage(url: listing.car.image).allowsHitTesting(false) }
                .clipped()
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(listing.car.brand).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.gray500)
                        Text(listing.car.model).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                    }
                    Spacer()
                    listingStatusChip(listing.status)
                }
                HStack(spacing: 4) {
                    Text("GH₵ \(formattedAmount(listing.askingPrice))").font(.system(size: 12)).foregroundStyle(Theme.gray600)
                    Text("·").foregroundStyle(Theme.gray400)
                    Text("\(listing.views) views").font(.system(size: 12)).foregroundStyle(Theme.gray600)
                    Text("·").foregroundStyle(Theme.gray400)
                    Text("\(listing.leads) leads").font(.system(size: 12)).foregroundStyle(Theme.gray600)
                }
                if listing.listingType == .featured {
                    Text("Featured").font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.orange)
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(Theme.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
                }
            }
            .padding(12)
        }
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 1)
    }

    private func listingStatusChip(_ status: ListingStatus) -> some View {
        let config: (Color, Color, String) = {
            switch status {
            case .active: return (Theme.success.opacity(0.12), Theme.success, "ACTIVE")
            case .sold: return (Theme.gray200, Theme.gray600, "SOLD")
            case .draft: return (Theme.warning.opacity(0.12), Theme.warning, "DRAFT")
            }
        }()
        return Text(config.2).font(.system(size: 10, weight: .bold)).foregroundStyle(config.1)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(config.0, in: RoundedRectangle(cornerRadius: 8))
    }

    private func leadCard(_ lead: Lead) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(lead.customerName).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray900)
                Text(lead.carModel).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                Text(lead.message).font(.system(size: 12)).foregroundStyle(Theme.gray400).lineLimit(1)
            }
            Spacer()
            leadStatusChip(lead.status)
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
    }

    private func leadStatusChip(_ status: LeadStatus) -> some View {
        let config: (Color, Color, String) = {
            switch status {
            case .new: return (Theme.orange.opacity(0.12), Theme.orange, "new")
            case .contacted: return (Theme.info.opacity(0.12), Theme.info, "contacted")
            case .converted: return (Theme.success.opacity(0.12), Theme.success, "converted")
            case .lost: return (Theme.gray200, Theme.gray600, "lost")
            }
        }()
        return Text(config.2).font(.system(size: 11, weight: .semibold)).foregroundStyle(config.1)
            .padding(.horizontal, 10).padding(.vertical, 4)
            .background(config.0, in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Admin

    private var adminDashboard: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                let stats = MockData.adminStats
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                    adminStatCard("Users", "\(stats.totalUsers)", .info, "person.2.fill")
                    adminStatCard("Revenue", "GH₵ \(formattedAmount(stats.totalRevenue))", .success, "chart.bar.fill")
                    adminStatCard("Bookings", "\(stats.totalBookings)", .orange, "calendar.badge.checkmark")
                    adminStatCard("Pending KYC", "\(stats.pendingKYC)", .warning, "shield.checkered")
                }
                growthCard(stats.monthlyGrowth)
                VStack(alignment: .leading, spacing: 12) {
                    Text("Users").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(MockData.adminUsers.prefix(5)) { user in adminUserRow(user) }
                }
            }
            .padding(20)
        }
    }

    private func adminStatCard(_ label: String, _ value: String, _ color: Color, _ icon: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color)
            Text(value).font(.system(size: 18, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity)
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
    }

    private func growthCard(_ growth: Double) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 18)).foregroundStyle(Theme.success)
            VStack(alignment: .leading, spacing: 1) {
                Text("Monthly Growth").font(.system(size: 13)).foregroundStyle(Theme.gray500)
                Text("+\(String(format: "%.1f", growth))%").font(.system(size: 20, weight: .heavy)).foregroundStyle(Theme.success)
            }
            Spacer()
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Theme.gray100).frame(height: 6)
                    RoundedRectangle(cornerRadius: 3).fill(Theme.success)
                        .frame(width: geo.size.width * min(growth / 100, 1), height: 6)
                }
            }
            .frame(width: 80, height: 6)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
    }

    private func adminUserRow(_ user: AdminUser) -> some View {
        HStack(spacing: 12) {
            Color.clear.frame(width: 40, height: 40)
                .overlay { RemoteImage(url: user.avatar).allowsHitTesting(false) }
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 1) {
                Text(user.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray900)
                Text(user.email).font(.system(size: 12)).foregroundStyle(Theme.gray500)
            }
            Spacer()
            adminStatusChip(user.status)
        }
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
    }

    private func adminStatusChip(_ status: AdminUserStatus) -> some View {
        let config: (Color, Color, String) = {
            switch status {
            case .active: return (Theme.success.opacity(0.12), Theme.success, "ACTIVE")
            case .suspended: return (Theme.error.opacity(0.12), Theme.error, "SUSPENDED")
            case .pendingKyc: return (Theme.warning.opacity(0.12), Theme.warning, "PENDING KYC")
            }
        }()
        return Text(config.2).font(.system(size: 10, weight: .bold)).foregroundStyle(config.1)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(config.0, in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Customer

    private var customerDashboard: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                welcomeCard
                HStack(spacing: 10) {
                    statCard("Bookings", "\(app.currentUser.totalBookings)", Theme.info, "calendar.badge.checkmark")
                    statCard("Favorites", "3", Theme.error, "heart.fill")
                    statCard("Wallet", "GH₵250", Theme.orange, "wallet.bifold.fill")
                }
                quickActions
                gettingStartedTip
            }
            .padding(20)
        }
    }

    private var welcomeCard: some View {
        HStack(spacing: 14) {
            Color.clear.frame(width: 56, height: 56)
                .overlay { RemoteImage(url: app.currentUser.avatar).allowsHitTesting(false) }
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.white.opacity(0.25), lineWidth: 3))
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back,").font(.system(size: 13)).foregroundStyle(Theme.gray400)
                Text(app.currentUser.name.split(separator: " ").first.map(String.init) ?? "Guest")
                    .font(.system(size: 22, weight: .heavy)).foregroundStyle(.white)
            }
            Spacer()
            if app.currentUser.verificationStatus == .approved {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.shield.fill").font(.system(size: 11))
                    Text("Verified").font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(Theme.success)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background(Theme.success.opacity(0.2), in: RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(20)
        .background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 18))
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                .frame(maxWidth: .infinity, alignment: .leading)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                actionCard("My Bookings", "calendar.badge.checkmark", Theme.info, { withAnimation { selectedTab = 2 } })
                actionCard("Favorites", "heart.fill", Theme.error, { router.push(.favorites) })
                actionCard("Marketplace", "car.fill", Theme.orange, { router.push(.marketplace) })
                actionCard("My Wallet", "wallet.bifold.fill", Theme.success, { router.push(.wallet) })
            }
        }
    }

    private func actionCard(_ title: String, _ icon: String, _ color: Color, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon).font(.system(size: 20)).foregroundStyle(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                Text(title).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.gray800)
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(Theme.gray400)
            }
            .padding(14)
            .background(.white, in: RoundedRectangle(cornerRadius: 14))
            .shadow(color: .black.opacity(0.05), radius: 4, y: 1)
        }
    }

    private var gettingStartedTip: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("New to AutoRide?").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            Text("Browse trending cars on the Home tab, tap the floating search button to find your perfect ride, or explore cars for sale in the Marketplace.")
                .font(.system(size: 13)).foregroundStyle(Theme.gray600).lineSpacing(4)
            Button {
                withAnimation { selectedTab = 0 }
            } label: {
                Text("Explore Cars").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(Theme.orange, in: RoundedRectangle(cornerRadius: 12))
            }
            .padding(.top, 8)
        }
        .padding(18)
        .background(Theme.orangeFaint, in: RoundedRectangle(cornerRadius: 16))
    }
}
