import SwiftUI

struct BookingView: View {
    let carId: String
    @Environment(Router.self) private var router
    @State private var pickupDate = Date()
    @State private var returnDate = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()
    @State private var location = "East Legon"

    private var car: Car? { MockData.cars.first { $0.id == carId } }

    private var totalDays: Int {
        max(1, Calendar.current.dateComponents([.day], from: pickupDate, to: returnDate).day ?? 1)
    }

    private var rentalCost: Int { (car?.pricePerDay ?? 0) * totalDays }
    private var serviceFee: Int { Int(Double(rentalCost) * 0.05) }
    private var insurance: Int { 50 * totalDays }
    private var total: Int { rentalCost + serviceFee + insurance }

    var body: some View {
        if let car {
            ZStack(alignment: .bottom) {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        carSummary(car)
                        datesCard
                        locationCard
                        priceBreakdown(car)
                        Color.clear.frame(height: 110)
                    }
                    .padding(20)
                }
                bottomBar
            }
            .background(Theme.gray50)
            .navigationTitle("Booking")
            .navigationBarTitleDisplayMode(.inline)
        } else {
            Text("Car not found").foregroundStyle(Theme.gray600)
        }
    }

    private func carSummary(_ car: Car) -> some View {
        HStack(spacing: 12) {
            Color.clear.frame(width: 90, height: 70)
                .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                .clipShape(RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 4) {
                Text(car.brand).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                Text(car.model).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("GH₵").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.orange)
                    Text("\(car.pricePerDay)").font(.system(size: 16, weight: .heavy)).foregroundStyle(Theme.gray900)
                    Text("/day").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
            }
            Spacer()
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private var datesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Rental Period").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            DatePicker("Pickup", selection: $pickupDate, in: Date()..., displayedComponents: .date)
                .tint(Theme.orange)
            Divider()
            DatePicker("Return", selection: $returnDate, in: pickupDate..., displayedComponents: .date)
                .tint(Theme.orange)
            HStack {
                Image(systemName: "clock.fill").font(.system(size: 12)).foregroundStyle(Theme.orange)
                Text("\(totalDays) day\(totalDays > 1 ? "s" : "") rental")
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.gray700)
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private var locationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pickup Location").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], alignment: .leading, spacing: 8) {
                ForEach(MockData.locations.prefix(6), id: \.self) { loc in
                    Button {
                        location = loc
                    } label: {
                        Text(loc).font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(location == loc ? .white : Theme.gray700)
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .frame(maxWidth: .infinity)
                            .background(location == loc ? Theme.orange : Theme.gray100, in: Capsule())
                    }
                }
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func priceBreakdown(_ car: Car) -> some View {
        VStack(spacing: 12) {
            Text("Price Details").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                .frame(maxWidth: .infinity, alignment: .leading)
            priceRow("GH₵ \(car.pricePerDay) × \(totalDays) days", rentalCost)
            priceRow("Service fee (5%)", serviceFee)
            priceRow("Insurance", insurance)
            Divider()
            HStack {
                Text("Total").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                Spacer()
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("GH₵").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
                    Text(formattedAmount(total)).font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.gray900)
                }
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func priceRow(_ label: String, _ value: Int) -> some View {
        HStack {
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.gray600)
            Spacer()
            Text("GH₵ \(formattedAmount(value))").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray800)
        }
    }

    private var bottomBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text("Total").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                Text("GH₵ \(formattedAmount(total))").font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.gray900)
            }
            Spacer()
            Button {
                router.push(.payment(carId: carId, days: totalDays, total: total, location: location))
            } label: {
                HStack(spacing: 6) {
                    Text("Continue").font(.system(size: 16, weight: .bold))
                    Image(systemName: "arrow.right").font(.system(size: 14, weight: .bold))
                }
                .foregroundStyle(.white).padding(.horizontal, 28).padding(.vertical, 16)
                .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(PressableStyle())
        }
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 30)
        .background(.white.clipShape(.rect(topLeadingRadius: 24, topTrailingRadius: 24)).ignoresSafeArea())
        .shadow(color: .black.opacity(0.1), radius: 12, y: -4)
    }
}
