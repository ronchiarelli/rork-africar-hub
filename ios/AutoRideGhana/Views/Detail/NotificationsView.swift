import SwiftUI

struct NotificationsView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 12) {
                ForEach(app.notifications) { notif in
                    Button {
                        app.markRead(notif.id)
                        if let carId = notif.actionCarId { router.push(.carDetails(carId)) }
                    } label: {
                        notificationCard(notif)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Mark all read") { app.markAllRead() }
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
            }
        }
    }

    private func notificationCard(_ notif: AppNotification) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: iconFor(notif.type)).font(.system(size: 18)).foregroundStyle(colorFor(notif.type))
                .frame(width: 44, height: 44)
                .background(colorFor(notif.type).opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(notif.title).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Spacer()
                    if !notif.isRead {
                        Circle().fill(Theme.orange).frame(width: 8, height: 8)
                    }
                }
                Text(notif.message).font(.system(size: 13)).foregroundStyle(Theme.gray600).lineSpacing(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(timeAgo(notif.timestamp)).font(.system(size: 11)).foregroundStyle(Theme.gray400).padding(.top, 2)
            }
        }
        .padding(14)
        .background(notif.isRead ? .white : Theme.orangeFaint, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 5, y: 1)
    }

    private func iconFor(_ type: NotificationType) -> String {
        switch type {
        case .booking: return "calendar"
        case .payment: return "creditcard.fill"
        case .promo: return "tag.fill"
        case .kyc: return "checkmark.shield.fill"
        case .system: return "bell.fill"
        }
    }

    private func colorFor(_ type: NotificationType) -> Color {
        switch type {
        case .booking: return Theme.success
        case .payment: return Theme.info
        case .promo: return Theme.orange
        case .kyc: return Theme.purpleMedium
        case .system: return Theme.gray600
        }
    }

    private func timeAgo(_ timestamp: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        let date = formatter.date(from: timestamp + "Z") ?? plain.date(from: timestamp + "Z")
        guard let date else { return String(timestamp.prefix(10)) }
        let interval = Date().timeIntervalSince(date)
        let days = Int(interval / 86400)
        if days <= 0 { return "Today" }
        if days == 1 { return "Yesterday" }
        return "\(days) days ago"
    }
}
