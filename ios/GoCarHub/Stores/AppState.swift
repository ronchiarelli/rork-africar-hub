import SwiftUI

/// Global app state: authentication, current role, favorites, and notifications.
@MainActor
@Observable
final class AppState {
    var isAuthenticated: Bool = false
    var currentRole: UserRole = .customer
    var favoriteIds: Set<String> = []
    var notifications: [AppNotification] = MockData.notifications
    var bookings: [Booking] = MockData.bookings

    var currentUser: UserProfile {
        MockData.profile(for: currentRole)
    }

    var unreadCount: Int {
        notifications.filter { !$0.isRead }.count
    }

    // MARK: - Auth

    func login() {
        isAuthenticated = true
    }

    func logout() {
        isAuthenticated = false
        currentRole = .customer
    }

    func switchRole(_ role: UserRole) {
        currentRole = role
    }

    // MARK: - Favorites

    func isFavorite(_ id: String) -> Bool {
        favoriteIds.contains(id)
    }

    func toggleFavorite(_ id: String) {
        if favoriteIds.contains(id) {
            favoriteIds.remove(id)
        } else {
            favoriteIds.insert(id)
        }
    }

    var favoriteCars: [Car] {
        MockData.cars.filter { favoriteIds.contains($0.id) }
    }

    // MARK: - Notifications

    func markAllRead() {
        notifications = notifications.map { notif in
            var n = notif
            n.isRead = true
            return n
        }
    }

    func markRead(_ id: String) {
        guard let idx = notifications.firstIndex(where: { $0.id == id }) else { return }
        notifications[idx].isRead = true
    }
}
