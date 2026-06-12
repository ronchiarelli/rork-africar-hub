import SwiftUI

struct AdminDashboardView: View {
    @State private var selectedTab = "Overview"
    @State private var users = MockData.adminUsers
    private let stats = MockData.adminStats
    private let tabs = ["Overview", "Users", "KYC"]

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $selectedTab) {
                ForEach(tabs, id: \.self) { Text($0).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 20).padding(.vertical, 12)
            .background(Theme.gray50)

            ScrollView(showsIndicators: false) {
                switch selectedTab {
                case "Users": usersTab
                case "KYC": kycTab
                default: overviewTab
                }
            }
            .background(Theme.gray50)
        }
        .background(Theme.gray50)
        .navigationTitle("Admin Dashboard")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var overviewTab: some View {
        VStack(spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                statCard("\(formattedAmount(stats.totalUsers))", "Total Users", "person.3.fill", Theme.info)
                statCard("\(formattedAmount(stats.totalBookings))", "Bookings", "calendar", Theme.success)
                statCard("\(formattedAmount(stats.activeListings))", "Active Listings", "tag.fill", Theme.orange)
                statCard("\(stats.pendingKYC)", "Pending KYC", "clock.fill", Theme.warning)
            }

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Total Revenue").font(.system(size: 14)).foregroundStyle(.white.opacity(0.7))
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("GH₵").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.orange)
                            Text(formattedAmount(stats.totalRevenue)).font(.system(size: 30, weight: .heavy)).foregroundStyle(.white)
                        }
                    }
                    Spacer()
                    VStack(spacing: 2) {
                        HStack(spacing: 3) {
                            Image(systemName: "arrow.up.right").font(.system(size: 12, weight: .bold))
                            Text("\(String(format: "%.1f", stats.monthlyGrowth))%").font(.system(size: 16, weight: .heavy))
                        }
                        .foregroundStyle(Theme.success)
                        Text("this month").font(.system(size: 11)).foregroundStyle(.white.opacity(0.6))
                    }
                }
                growthBars
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(LinearGradient(colors: [Theme.purpleDeep, Theme.purpleMedium], startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: RoundedRectangle(cornerRadius: 20))

            if stats.pendingKYC > 0 {
                HStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 20)).foregroundStyle(Theme.warning)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(stats.pendingKYC) KYC requests pending").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.gray900)
                        Text("Review them in the KYC tab.").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                    }
                    Spacer()
                }
                .padding(14)
                .background(Theme.warning.opacity(0.1), in: RoundedRectangle(cornerRadius: 14))
            }
        }
        .padding(20)
    }

    private var growthBars: some View {
        let heights: [CGFloat] = [0.4, 0.55, 0.45, 0.7, 0.6, 0.85, 1.0]
        return HStack(alignment: .bottom, spacing: 8) {
            ForEach(Array(heights.enumerated()), id: \.offset) { idx, h in
                RoundedRectangle(cornerRadius: 4)
                    .fill(idx == heights.count - 1 ? Theme.orange : Color.white.opacity(0.25))
                    .frame(height: 60 * h)
                    .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 60)
        .padding(.top, 8)
    }

    private func statCard(_ value: String, _ label: String, _ icon: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(color)
                .frame(width: 40, height: 40).background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            Text(value).font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 12)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private var usersTab: some View {
        VStack(spacing: 12) {
            ForEach(users) { user in
                HStack(spacing: 12) {
                    Color.clear.frame(width: 44, height: 44)
                        .overlay { RemoteImage(url: user.avatar).allowsHitTesting(false) }
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 3) {
                        Text(user.name).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                        Text(user.email).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(user.role.label).font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.purpleMedium)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Theme.purpleFaint, in: Capsule())
                        adminStatusBadge(user.status)
                    }
                }
                .padding(14)
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
            }
        }
        .padding(20)
    }

    private var pendingIndices: [Int] {
        users.indices.filter { users[$0].status == .pendingKyc }
    }

    private var kycTab: some View {
        VStack(spacing: 12) {
            ForEach(pendingIndices, id: \.self) { idx in
                let user = users[idx]
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        Color.clear.frame(width: 44, height: 44)
                            .overlay { RemoteImage(url: user.avatar).allowsHitTesting(false) }
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.name).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                            Text("Joined \(user.joinDate)").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                        }
                        Spacer()
                    }
                    HStack(spacing: 10) {
                        Button {
                            withAnimation { users[idx].status = .active }
                        } label: {
                            Text("Approve").font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 11)
                                .background(Theme.success, in: RoundedRectangle(cornerRadius: 12))
                        }
                        Button {
                            withAnimation { users[idx].status = .suspended }
                        } label: {
                            Text("Reject").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.error)
                                .frame(maxWidth: .infinity).padding(.vertical, 11)
                                .background(Theme.error.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
                .padding(14)
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
            }
            if pendingIndices.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 44)).foregroundStyle(Theme.success)
                    Text("All caught up!").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray700)
                    Text("No pending KYC requests.").font(.system(size: 13)).foregroundStyle(Theme.gray400)
                }
                .padding(.top, 60)
            }
        }
        .padding(20)
    }

    private func adminStatusBadge(_ status: AdminUserStatus) -> some View {
        let color: Color = {
            switch status {
            case .active: return Theme.success
            case .suspended: return Theme.error
            case .pendingKyc: return Theme.warning
            }
        }()
        return Text(status.label).font(.system(size: 10, weight: .bold)).foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.12), in: Capsule())
    }
}
