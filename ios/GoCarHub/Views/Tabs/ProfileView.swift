import SwiftUI

struct ProfileView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @State private var showRolePicker = false
    @State private var showLogoutConfirm = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                profileHeader
                ForEach(Array(menuGroups.enumerated()), id: \.offset) { _, group in
                    menuCard(group)
                }
            }
            .padding(.bottom, 30)
        }
        .background(Theme.gray50)
        .ignoresSafeArea(edges: .top)
        .confirmationDialog("Switch Account", isPresented: $showRolePicker, titleVisibility: .visible) {
            ForEach(UserRole.allCases, id: \.self) { role in
                Button(role.label + (role == app.currentRole ? " ✓" : "")) { app.switchRole(role) }
            }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Logout", isPresented: $showLogoutConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Logout", role: .destructive) { app.logout() }
        } message: {
            Text("Are you sure you want to logout?")
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .bottomTrailing) {
                Color.clear.frame(width: 80, height: 80)
                    .overlay { RemoteImage(url: app.currentUser.avatar).allowsHitTesting(false) }
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Theme.orange, lineWidth: 3))
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 12)).foregroundStyle(.white)
                    .frame(width: 24, height: 24)
                    .background(Theme.success, in: Circle())
                    .overlay(Circle().stroke(Theme.purpleDeep, lineWidth: 2))
            }
            .padding(.bottom, 12)

            Text(app.currentUser.name).font(.system(size: 22, weight: .heavy)).foregroundStyle(.white)
            Text(app.currentUser.email).font(.system(size: 13)).foregroundStyle(Theme.gray400).padding(.top, 2)

            Text(app.currentRole.label)
                .font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.orange)
                .padding(.horizontal, 14).padding(.vertical, 4)
                .background(Theme.orange.opacity(0.2), in: Capsule())
                .padding(.top, 8)

            HStack(spacing: 24) {
                statItem("\(app.currentUser.totalBookings)", "Bookings")
                divider
                statItem(app.currentUser.verificationStatus == .approved ? "✓" : "○", "Verified")
                divider
                statItem(String(app.currentUser.memberSince.prefix(4)), "Member")
            }
            .padding(.top, 20)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .padding(.top, 40)
        .padding(.horizontal, 20)
        .background(Theme.purpleDeep.clipShape(.rect(bottomLeadingRadius: 28, bottomTrailingRadius: 28)).ignoresSafeArea(edges: .top))
    }

    private func statItem(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 20, weight: .heavy)).foregroundStyle(.white)
            Text(label).font(.system(size: 12)).foregroundStyle(Theme.gray400)
        }
    }

    private var divider: some View {
        Rectangle().fill(Color.white.opacity(0.15)).frame(width: 1, height: 30)
    }

    // MARK: - Menu

    private struct MenuItem: Identifiable {
        let id = UUID()
        let icon: String
        let color: Color
        let label: String
        var badge: String? = nil
        var destructive: Bool = false
        let action: () -> Void
    }

    private var menuGroups: [[MenuItem]] {
        var groups: [[MenuItem]] = []
        groups.append([
            MenuItem(icon: "heart.fill", color: Theme.orange, label: "My Favorites") { router.push(.favorites) },
            MenuItem(icon: "bell.fill", color: Theme.info, label: "Notifications", badge: app.unreadCount > 0 ? "\(app.unreadCount)" : nil) { router.push(.notifications) },
            MenuItem(icon: "checkmark.seal.fill", color: Theme.success, label: "KYC Verification") { router.push(.kyc) },
        ])
        switch app.currentRole {
        case .fleetOwner:
            groups.append([MenuItem(icon: "car.2.fill", color: Theme.purpleMedium, label: "Fleet Dashboard") { router.push(.fleetDashboard) }])
        case .dealership:
            groups.append([MenuItem(icon: "storefront.fill", color: Theme.purpleMedium, label: "Dealer Dashboard") { router.push(.dealerDashboard) }])
        case .admin:
            groups.append([MenuItem(icon: "rectangle.3.group.fill", color: Theme.purpleMedium, label: "Admin Dashboard") { router.push(.adminDashboard) }])
        case .customer:
            break
        }
        groups.append([
            MenuItem(icon: "person.2.fill", color: Theme.gray600, label: "Switch Account") { showRolePicker = true },
            MenuItem(icon: "gearshape.fill", color: Theme.gray600, label: "Settings") { router.push(.settings) },
            MenuItem(icon: "questionmark.circle.fill", color: Theme.gray600, label: "Help & Support") { router.push(.help) },
            MenuItem(icon: "wallet.bifold.fill", color: Theme.gray600, label: "My Wallet") { router.push(.wallet) },
        ])
        groups.append([
            MenuItem(icon: "arrow.right.square.fill", color: Theme.error, label: "Logout", destructive: true) { showLogoutConfirm = true },
        ])
        return groups
    }

    private func menuCard(_ group: [MenuItem]) -> some View {
        VStack(spacing: 0) {
            ForEach(Array(group.enumerated()), id: \.element.id) { idx, item in
                Button(action: item.action) {
                    HStack(spacing: 14) {
                        Image(systemName: item.icon).font(.system(size: 18)).foregroundStyle(item.color).frame(width: 24)
                        Text(item.label).font(.system(size: 15, weight: .medium))
                            .foregroundStyle(item.destructive ? Theme.error : Theme.gray800)
                        Spacer()
                        if let badge = item.badge {
                            Text(badge).font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                                .frame(width: 20, height: 20).background(Theme.orange, in: Circle())
                        }
                        Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(Theme.gray400)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                if idx < group.count - 1 {
                    Divider().padding(.leading, 54)
                }
            }
        }
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, y: 2)
        .padding(.horizontal, 20)
    }
}
