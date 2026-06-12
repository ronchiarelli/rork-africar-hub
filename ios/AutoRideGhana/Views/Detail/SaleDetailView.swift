import SwiftUI

struct SaleDetailView: View {
    let saleId: String
    @Environment(Router.self) private var router

    private var car: SaleCar? { MockData.saleCars.first { $0.id == saleId } }

    var body: some View {
        if let car {
            ZStack(alignment: .bottom) {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        Color.clear.frame(height: 280)
                            .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                            .clipped()
                            .overlay(alignment: .topLeading) {
                                Button { router.pop() } label: {
                                    Image(systemName: "chevron.left").font(.system(size: 18)).foregroundStyle(.white)
                                        .frame(width: 40, height: 40)
                                        .background(Color.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 14))
                                }
                                .padding(.horizontal, 16).padding(.top, 56)
                            }

                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(car.brand).font(.system(size: 14)).foregroundStyle(Theme.gray500)
                                    Text(car.model).font(.system(size: 24, weight: .heavy)).foregroundStyle(Theme.gray900)
                                }
                                Spacer()
                                Text(car.condition.rawValue).font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.purpleMedium)
                                    .padding(.horizontal, 12).padding(.vertical, 6)
                                    .background(Theme.purpleFaint, in: Capsule())
                            }
                            HStack(spacing: 6) {
                                Image(systemName: "eye.fill").font(.system(size: 12)).foregroundStyle(Theme.gray400)
                                Text("\(formattedAmount(car.views)) views").font(.system(size: 13)).foregroundStyle(Theme.gray500)
                            }
                            .padding(.top, 8)

                            HStack(spacing: 0) {
                                spec("calendar", String(car.year), "Year")
                                spec("gauge.high", "\(car.mileage / 1000)k", "km")
                                spec("fuelpump.fill", car.fuelType.rawValue, "Fuel")
                                spec("gearshape.fill", car.transmission.rawValue, "Gear")
                            }
                            .padding(16)
                            .background(.white, in: RoundedRectangle(cornerRadius: 20))
                            .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
                            .padding(.top, 20)

                            Text("Description").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900).padding(.top, 24)
                            Text(car.description).font(.system(size: 14)).foregroundStyle(Theme.gray600).lineSpacing(6).padding(.top, 8)

                            Text("Features").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900).padding(.top, 24).padding(.bottom, 10)
                            FlowLayout(spacing: 8) {
                                ForEach(car.features, id: \.self) { f in
                                    Text(f).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.purpleMedium)
                                        .padding(.horizontal, 14).padding(.vertical, 8)
                                        .background(Theme.purpleFaint, in: RoundedRectangle(cornerRadius: 10))
                                }
                            }

                            Text("Dealer").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900).padding(.top, 24).padding(.bottom, 10)
                            HStack(spacing: 12) {
                                Color.clear.frame(width: 44, height: 44)
                                    .overlay { RemoteImage(url: car.dealerAvatar).allowsHitTesting(false) }
                                    .clipShape(Circle())
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(car.dealerName).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                                    Text(car.dealerPhone).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                                }
                                Spacer()
                            }
                            .padding(14)
                            .background(.white, in: RoundedRectangle(cornerRadius: 16))
                            .shadow(color: .black.opacity(0.06), radius: 6, y: 2)

                            Color.clear.frame(height: 110)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                        .background(Theme.gray50.clipShape(.rect(topLeadingRadius: 28, topTrailingRadius: 28)).offset(y: -24))
                    }
                }
                .ignoresSafeArea(edges: .top)

                bottomBar(car)
            }
            .background(Theme.gray50)
            .toolbar(.hidden, for: .navigationBar)
        } else {
            Text("Listing not found").foregroundStyle(Theme.gray600)
        }
    }

    private func spec(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(Theme.orange)
                .frame(width: 44, height: 44).background(Theme.orangeFaint, in: RoundedRectangle(cornerRadius: 14))
            Text(value).font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
            Text(label).font(.system(size: 11)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity)
    }

    private func bottomBar(_ car: SaleCar) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 0) {
                Text("Price").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("GH₵").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
                    Text(formattedAmount(car.salePrice)).font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.gray900)
                }
            }
            Spacer()
            Button { openWhatsApp(car) } label: {
                Image(systemName: "message.fill").font(.system(size: 16)).foregroundStyle(.white)
                    .frame(width: 50, height: 50).background(Theme.whatsapp, in: RoundedRectangle(cornerRadius: 14))
            }
            Button {
                if let url = URL(string: "tel:\(car.dealerPhone)") { UIApplication.shared.open(url) }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "phone.fill").font(.system(size: 15))
                    Text("Call Dealer").font(.system(size: 15, weight: .bold))
                }
                .foregroundStyle(.white).padding(.horizontal, 20).padding(.vertical, 16)
                .background(Theme.orange, in: RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(PressableStyle())
        }
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 30)
        .background(.white.clipShape(.rect(topLeadingRadius: 24, topTrailingRadius: 24)).ignoresSafeArea())
        .shadow(color: .black.opacity(0.1), radius: 12, y: -4)
    }

    private func openWhatsApp(_ car: SaleCar) {
        let message = "Hi, I'm interested in the \(car.brand) \(car.model) (\(car.year)) listed for sale on AutoRide."
        let encoded = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let phone = car.dealerPhone.replacingOccurrences(of: "+", with: "")
        if let url = URL(string: "https://wa.me/\(phone)?text=\(encoded)") { UIApplication.shared.open(url) }
    }
}
