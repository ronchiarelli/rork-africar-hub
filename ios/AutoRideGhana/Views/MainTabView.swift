import SwiftUI

struct MainTabView: View {
    @State private var router = Router()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack(path: $router.path) {
            TabView(selection: $selectedTab) {
                HomeView(selectedTab: $selectedTab)
                    .tabItem { Label("Home", systemImage: "house.fill") }.tag(0)
                DashboardView(selectedTab: $selectedTab)
                    .tabItem { Label("Dashboard", systemImage: "rectangle.grid.1x2.fill") }.tag(1)
                BookingsView()
                    .tabItem { Label("Bookings", systemImage: "calendar") }.tag(2)
                ProfileView()
                    .tabItem { Label("Profile", systemImage: "person.fill") }.tag(3)
            }
            .tint(Theme.orange)
            .navigationDestination(for: Route.self) { route in
                destination(for: route)
            }
        }
        .environment(router)
    }

    @ViewBuilder
    private func destination(for route: Route) -> some View {
        switch route {
        case .carDetails(let id): CarDetailsView(carId: id)
        case .booking(let id): BookingView(carId: id)
        case .payment(let carId, let days, let total, let location):
            PaymentView(carId: carId, days: days, total: total, location: location)
        case .bookingDetail(let id): BookingDetailView(bookingId: id)
        case .review(let id): ReviewView(carId: id)
        case .marketplace: MarketplaceView()
        case .saleDetail(let id): SaleDetailView(saleId: id)
        case .favorites: FavoritesView()
        case .notifications: NotificationsView()
        case .kyc: KYCView()
        case .settings: SettingsView()
        case .help: HelpView()
        case .wallet: WalletView()
        case .search: SearchView()
        case .fleetDashboard: FleetDashboardView()
        case .dealerDashboard: DealerDashboardView()
        case .adminDashboard: AdminDashboardView()
        }
    }
}
