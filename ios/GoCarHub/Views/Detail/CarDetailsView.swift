import SwiftUI

struct CarDetailsView: View {
    let carId: String
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @State private var imageIndex = 0

    private var car: Car? { MockData.cars.first { $0.id == carId } }

    var body: some View {
        if let car {
            content(car)
        } else {
            VStack(spacing: 16) {
                Text("Car not found").font(.system(size: 18, weight: .semibold)).foregroundStyle(Theme.gray700)
                Button("Go Back") { router.pop() }
                    .foregroundStyle(.white).padding(.horizontal, 24).padding(.vertical, 12)
                    .background(Theme.orange, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private func content(_ car: Car) -> some View {
        ZStack(alignment: .bottom) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    gallery(car)
                    infoSection(car).padding(.bottom, 120)
                }
            }
            .ignoresSafeArea(edges: .top)
            bottomBar(car)
        }
        .background(Theme.gray50)
        .toolbar(.hidden, for: .navigationBar)
    }

    private func gallery(_ car: Car) -> some View {
        ZStack(alignment: .top) {
            TabView(selection: $imageIndex) {
                ForEach(Array(car.images.enumerated()), id: \.offset) { idx, img in
                    Color.clear.overlay { RemoteImage(url: img).allowsHitTesting(false) }.clipped().tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 300)
            .background(Theme.purpleDeep)

            HStack {
                circleButton("chevron.left") { router.pop() }
                Spacer()
                HStack(spacing: 8) {
                    circleButton(app.isFavorite(car.id) ? "heart.fill" : "heart",
                                 tint: app.isFavorite(car.id) ? Theme.orange : .white) { app.toggleFavorite(car.id) }
                    circleButton("square.and.arrow.up") {}
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 56)

            if car.images.count > 1 {
                VStack {
                    Spacer()
                    HStack(spacing: 6) {
                        ForEach(0..<car.images.count, id: \.self) { idx in
                            Capsule().fill(idx == imageIndex ? Theme.orange : Color.white.opacity(0.4))
                                .frame(width: idx == imageIndex ? 20 : 8, height: 8)
                        }
                    }
                    .padding(.bottom, 30)
                }
                .frame(height: 300)
            }
        }
    }

    private func circleButton(_ icon: String, tint: Color = .white, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(Color.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 14))
        }
    }

    private func infoSection(_ car: Car) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(car.brand).font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.gray500)
                    Text(car.model).font(.system(size: 24, weight: .heavy)).foregroundStyle(Theme.gray900)
                }
                Spacer()
                Text(String(car.year)).font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 10))
            }

            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "star.fill").font(.system(size: 14)).foregroundStyle(Theme.star)
                    Text(String(format: "%.1f", car.rating)).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Text("(\(car.reviewCount) reviews)").font(.system(size: 13)).foregroundStyle(Theme.gray500)
                }
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: "mappin").font(.system(size: 13)).foregroundStyle(Theme.gray500)
                    Text(car.location).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.gray600)
                }
            }
            .padding(.top, 12)

            HStack(spacing: 0) {
                specItem("person.2.fill", "\(car.seats)", "Seats")
                specItem("gauge.high", "\(car.horsepower)", "HP")
                specItem("fuelpump.fill", car.fuelType.rawValue, "Fuel")
                specItem("snowflake", car.hasAC ? "Yes" : "No", "A/C")
            }
            .padding(16)
            .background(.white, in: RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
            .padding(.top, 24)

            sectionTitle("About This Car").padding(.top, 24)
            Text(car.description).font(.system(size: 14)).foregroundStyle(Theme.gray600).lineSpacing(6)

            sectionTitle("Features").padding(.top, 24)
            FlowLayout(spacing: 8) {
                ForEach(car.features, id: \.self) { feature in
                    Text(feature).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.purpleMedium)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(Theme.purpleFaint, in: RoundedRectangle(cornerRadius: 10))
                }
            }

            sectionTitle("Listed By").padding(.top, 24)
            ownerCard(car)
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
        .background(Theme.gray50.clipShape(.rect(topLeadingRadius: 28, topTrailingRadius: 28)).offset(y: -24))
    }

    private func specItem(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(Theme.orange)
                .frame(width: 44, height: 44).background(Theme.orangeFaint, in: RoundedRectangle(cornerRadius: 14))
            Text(value).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 11)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
            .frame(maxWidth: .infinity, alignment: .leading).padding(.bottom, 10)
    }

    private func ownerCard(_ car: Car) -> some View {
        HStack {
            HStack(spacing: 12) {
                Text(String(car.ownerName.prefix(1))).font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 44).background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 14))
                VStack(alignment: .leading, spacing: 2) {
                    Text(car.ownerName).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Text(car.ownerPhone).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
            }
            Spacer()
            HStack(spacing: 8) {
                contactButton("message.fill", Theme.whatsapp) { openWhatsApp(car) }
                contactButton("phone.fill", Theme.info) { openURL("tel:\(car.ownerPhone)") }
            }
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, y: 2)
    }

    private func contactButton(_ icon: String, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(.white)
                .frame(width: 38, height: 38).background(color, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private func bottomBar(_ car: Car) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text("Price").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("GH₵").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
                    Text("\(car.pricePerDay)").font(.system(size: 26, weight: .heavy)).foregroundStyle(Theme.gray900)
                    Text("/day").font(.system(size: 13)).foregroundStyle(Theme.gray500)
                }
            }
            Spacer()
            Button {
                router.push(.booking(car.id))
            } label: {
                Text("Rent Now").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 32).padding(.vertical, 16)
                    .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(PressableStyle())
        }
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 30)
        .background(.white.clipShape(.rect(topLeadingRadius: 24, topTrailingRadius: 24)).ignoresSafeArea())
        .shadow(color: .black.opacity(0.1), radius: 12, y: -4)
    }

    private func openWhatsApp(_ car: Car) {
        let message = "Hi, I'm interested in renting the \(car.brand) \(car.model) listed on AutoRide."
        let encoded = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let phone = car.ownerPhone.replacingOccurrences(of: "+", with: "")
        openURL("https://wa.me/\(phone)?text=\(encoded)")
    }

    private func openURL(_ string: String) {
        guard let url = URL(string: string) else { return }
        UIApplication.shared.open(url)
    }
}
