import SwiftUI

struct FleetDashboardView: View {
    private let earnings = MockData.earnings
    private let vehicles = MockData.fleetVehicles

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                revenueCard
                statsRow
                VStack(alignment: .leading, spacing: 12) {
                    Text("My Fleet").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(vehicles) { vehicle in fleetCard(vehicle) }
                }
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("Fleet Dashboard")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var revenueCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Total Revenue").font(.system(size: 14)).foregroundStyle(.white.opacity(0.7))
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("GH₵").font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.orange)
                Text(formattedAmount(earnings.totalRevenue)).font(.system(size: 36, weight: .heavy)).foregroundStyle(.white)
            }
            HStack(spacing: 16) {
                miniStat("This Month", earnings.thisMonth, Theme.success)
                miniStat("Pending", earnings.pendingPayouts, Theme.orange)
            }
            .padding(.top, 6)
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LinearGradient(colors: [Theme.purpleDeep, Theme.purpleMedium], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 22))
    }

    private func miniStat(_ label: String, _ value: Int, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 11)).foregroundStyle(.white.opacity(0.6))
            Text("GH₵ \(formattedAmount(value))").font(.system(size: 15, weight: .bold)).foregroundStyle(color)
        }
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard("\(earnings.completedTrips)", "Completed Trips", "flag.checkered", Theme.info)
            statCard("\(earnings.activeRentals)", "Active Rentals", "car.fill", Theme.success)
        }
    }

    private func statCard(_ value: String, _ label: String, _ icon: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(color)
                .frame(width: 40, height: 40).background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            Text(value).font(.system(size: 24, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 12)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func fleetCard(_ vehicle: FleetVehicle) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Color.clear.frame(width: 80, height: 64)
                    .overlay { RemoteImage(url: vehicle.car.image).allowsHitTesting(false) }
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.car.model).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Text("\(vehicle.totalTrips) trips").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
                Spacer()
                fleetStatusBadge(vehicle.status)
            }
            Divider().padding(.vertical, 12)
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Earnings").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                    Text("GH₵ \(formattedAmount(vehicle.totalEarnings))").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Next Maintenance").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                    Text(vehicle.nextMaintenance).font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(vehicle.status == .maintenance ? Theme.error : Theme.gray700)
                }
            }
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func fleetStatusBadge(_ status: FleetStatus) -> some View {
        let color: Color = {
            switch status {
            case .active: return Theme.success
            case .rented: return Theme.info
            case .maintenance: return Theme.error
            case .inactive: return Theme.gray500
            }
        }()
        return Text(status.rawValue.capitalized).font(.system(size: 11, weight: .bold)).foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(color.opacity(0.12), in: Capsule())
    }
}
