import SwiftUI

struct BookingsView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @State private var selectedTab = "All"

    private let tabs = ["All", "Active", "Upcoming", "Completed"]

    private var filtered: [Booking] {
        switch selectedTab {
        case "Active": return app.bookings.filter { $0.status == .active || $0.status == .approved }
        case "Upcoming": return app.bookings.filter { $0.status == .pending }
        case "Completed": return app.bookings.filter { $0.status == .completed }
        default: return app.bookings
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Text("My Bookings").font(.system(size: 28, weight: .heavy)).foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20).padding(.top, 60).padding(.bottom, 16)
                .background(Theme.purpleDeep.ignoresSafeArea(edges: .top))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(tabs, id: \.self) { tab in
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) { selectedTab = tab }
                        } label: {
                            Text(tab)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(selectedTab == tab ? .white : Theme.gray600)
                                .padding(.horizontal, 18).padding(.vertical, 9)
                                .background(selectedTab == tab ? Theme.orange : .white, in: Capsule())
                                .overlay(Capsule().stroke(Theme.gray200, lineWidth: selectedTab == tab ? 0 : 1))
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .padding(.vertical, 14)
            .background(Theme.gray50)

            if filtered.isEmpty {
                emptyState
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        ForEach(filtered) { booking in
                            BookingRow(booking: booking) { router.push(.bookingDetail(booking.id)) }
                        }
                    }
                    .padding(20)
                }
            }
        }
        .background(Theme.gray50)
        .ignoresSafeArea(edges: .top)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48)).foregroundStyle(Theme.gray300)
            Text("No bookings here yet").font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.gray600)
            Text("Your \(selectedTab.lowercased()) trips will appear here.")
                .font(.system(size: 14)).foregroundStyle(Theme.gray400)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct BookingRow: View {
    let booking: Booking
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Color.clear.frame(width: 90, height: 70)
                        .overlay { RemoteImage(url: booking.car.image).allowsHitTesting(false) }
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(booking.car.brand) \(booking.car.model)")
                            .font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                        HStack(spacing: 4) {
                            Image(systemName: "mappin").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                            Text(booking.pickupLocation).font(.system(size: 12)).foregroundStyle(Theme.gray500).lineLimit(1)
                        }
                        HStack(spacing: 4) {
                            Image(systemName: "calendar").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                            Text("\(booking.pickupDate) → \(booking.returnDate)").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                        }
                    }
                    Spacer()
                    StatusBadge(status: booking.status)
                }
                Divider().padding(.vertical, 12)
                HStack {
                    Text("\(booking.totalDays) days").font(.system(size: 13)).foregroundStyle(Theme.gray600)
                    Spacer()
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("GH₵").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.orange)
                        Text(formattedAmount(booking.totalPrice)).font(.system(size: 18, weight: .heavy)).foregroundStyle(Theme.gray900)
                    }
                }
            }
            .padding(14)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        }
        .buttonStyle(PressableStyle())
    }
}

struct StatusBadge: View {
    let status: BookingStatus

    private var color: Color {
        switch status {
        case .approved, .active: return Theme.success
        case .pending: return Theme.warning
        case .completed: return Theme.info
        case .cancelled: return Theme.error
        }
    }

    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(color.opacity(0.12), in: Capsule())
    }
}
