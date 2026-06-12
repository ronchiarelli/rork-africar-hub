import SwiftUI

struct BookingDetailView: View {
    let bookingId: String
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router

    private var booking: Booking? { app.bookings.first { $0.id == bookingId } }

    var body: some View {
        if let booking {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    statusBanner(booking)
                    carCard(booking)
                    tripDetails(booking)
                    ownerCard(booking)
                    if booking.status == .completed {
                        Button {
                            router.push(.review(booking.carId))
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "star.fill")
                                Text("Rate Your Trip").font(.system(size: 16, weight: .bold))
                            }
                            .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 16)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
                .padding(20)
            }
            .background(Theme.gray50)
            .navigationTitle("Booking Details")
            .navigationBarTitleDisplayMode(.inline)
        } else {
            Text("Booking not found").foregroundStyle(Theme.gray600)
        }
    }

    private func statusBanner(_ booking: Booking) -> some View {
        HStack(spacing: 12) {
            Image(systemName: iconFor(booking.status)).font(.system(size: 24)).foregroundStyle(.white)
            VStack(alignment: .leading, spacing: 2) {
                Text(booking.status.rawValue.capitalized).font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                Text(messageFor(booking.status)).font(.system(size: 13)).foregroundStyle(.white.opacity(0.85))
            }
            Spacer()
        }
        .padding(16)
        .background(colorFor(booking.status), in: RoundedRectangle(cornerRadius: 16))
    }

    private func carCard(_ booking: Booking) -> some View {
        Button {
            router.push(.carDetails(booking.carId))
        } label: {
            HStack(spacing: 12) {
                Color.clear.frame(width: 90, height: 70)
                    .overlay { RemoteImage(url: booking.car.image).allowsHitTesting(false) }
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.car.brand).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                    Text(booking.car.model).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(Theme.star)
                        Text(String(format: "%.1f", booking.car.rating)).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.gray700)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.gray400)
            }
            .padding(14)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
    }

    private func tripDetails(_ booking: Booking) -> some View {
        VStack(spacing: 12) {
            Text("Trip Details").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                .frame(maxWidth: .infinity, alignment: .leading)
            detailRow("calendar", "Pickup Date", booking.pickupDate)
            detailRow("calendar.badge.checkmark", "Return Date", booking.returnDate)
            detailRow("mappin.circle.fill", "Location", booking.pickupLocation)
            detailRow("clock.fill", "Duration", "\(booking.totalDays) days")
            detailRow("number", "Reference", "AR-\(booking.id.uppercased())")
            Divider()
            HStack {
                Text("Total Paid").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                Spacer()
                Text("GH₵ \(formattedAmount(booking.totalPrice))").font(.system(size: 20, weight: .heavy)).foregroundStyle(Theme.orange)
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func detailRow(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(Theme.orange).frame(width: 22)
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.gray600)
            Spacer()
            Text(value).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray900)
        }
    }

    private func ownerCard(_ booking: Booking) -> some View {
        HStack {
            HStack(spacing: 12) {
                Text(String(booking.car.ownerName.prefix(1))).font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 44).background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 14))
                VStack(alignment: .leading, spacing: 2) {
                    Text(booking.car.ownerName).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Text(booking.car.ownerPhone).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
            }
            Spacer()
            Button {
                if let url = URL(string: "tel:\(booking.car.ownerPhone)") { UIApplication.shared.open(url) }
            } label: {
                Image(systemName: "phone.fill").font(.system(size: 15)).foregroundStyle(.white)
                    .frame(width: 38, height: 38).background(Theme.info, in: RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func iconFor(_ status: BookingStatus) -> String {
        switch status {
        case .approved, .active: return "checkmark.circle.fill"
        case .pending: return "clock.fill"
        case .completed: return "flag.checkered"
        case .cancelled: return "xmark.circle.fill"
        }
    }

    private func colorFor(_ status: BookingStatus) -> Color {
        switch status {
        case .approved, .active: return Theme.success
        case .pending: return Theme.warning
        case .completed: return Theme.info
        case .cancelled: return Theme.error
        }
    }

    private func messageFor(_ status: BookingStatus) -> String {
        switch status {
        case .approved: return "Your booking is confirmed and ready."
        case .active: return "Your trip is currently active."
        case .pending: return "Awaiting owner approval."
        case .completed: return "This trip has been completed."
        case .cancelled: return "This booking was cancelled."
        }
    }
}
