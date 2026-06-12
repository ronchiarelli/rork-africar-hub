import SwiftUI

/// Type-safe navigation destinations pushed onto the main NavigationStack.
enum Route: Hashable {
    case carDetails(String)
    case booking(String)
    case payment(carId: String, days: Int, total: Int, location: String)
    case bookingDetail(String)
    case review(String)
    case marketplace
    case saleDetail(String)
    case favorites
    case notifications
    case kyc
    case settings
    case help
    case wallet
    case fleetDashboard
    case dealerDashboard
    case adminDashboard
}

@MainActor
@Observable
final class Router {
    var path = NavigationPath()

    func push(_ route: Route) {
        path.append(route)
    }

    func pop() {
        if !path.isEmpty { path.removeLast() }
    }

    func popToRoot() {
        path = NavigationPath()
    }
}
