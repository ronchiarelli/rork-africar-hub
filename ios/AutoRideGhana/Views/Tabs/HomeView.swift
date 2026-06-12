import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @Binding var selectedTab: Int
    @State private var fabScale: CGFloat = 1

    private var availableCars: [Car] { MockData.cars.filter { $0.isAvailable } }
    private var featuredSaleCars: [SaleCar] { MockData.saleCars.filter { $0.isFeatured } }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                header
                brandsSection
                trendingSection
                promoBanner
                forSaleSection
                nearYouSection
            }
            .padding(.bottom, 20)
        }
        .background(Theme.gray50)
        .ignoresSafeArea(edges: .top)
        .overlay(alignment: .bottomTrailing) {
            Button {
                router.push(.search)
            } label: {
                Image(systemName: "magnifyingglass").font(.system(size: 22, weight: .semibold)).foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Theme.orange, in: Circle())
                    .shadow(color: Theme.orange.opacity(0.4), radius: 12, y: 6)
                    .scaleEffect(fabScale)
            }
            .buttonStyle(.plain)
            .padding(.trailing, 20)
            .padding(.bottom, 28)
            .onLongPressGesture(minimumDuration: .infinity, pressing: { pressing in
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    fabScale = pressing ? 0.9 : 1.0
                }
            }, perform: {})
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "mappin").font(.system(size: 14)).foregroundStyle(Theme.orange)
                    Text("Location").font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.gray300)
                }
                Spacer()
                HStack(spacing: 10) {
                    iconButton("heart") { router.push(.favorites) }
                    ZStack(alignment: .topTrailing) {
                        iconButton("bell") { router.push(.notifications) }
                        if app.unreadCount > 0 {
                            Circle().fill(Theme.orange).frame(width: 7, height: 7).offset(x: -8, y: 8)
                        }
                    }
                }
            }
            .padding(.bottom, 14)

            Text("Hello, \(app.currentUser.name.split(separator: " ").first.map(String.init) ?? "Guest")")
                .font(.system(size: 26, weight: .heavy)).foregroundStyle(.white)
            Text("Find your perfect ride today")
                .font(.system(size: 14)).foregroundStyle(Theme.gray400).padding(.top, 4)

            Button {
                withAnimation { selectedTab = 1 }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").font(.system(size: 16)).foregroundStyle(Theme.gray400)
                    Text("Search cars, brands, locations...").font(.system(size: 14)).foregroundStyle(Theme.gray400)
                    Spacer()
                }
                .padding(.horizontal, 16).padding(.vertical, 14)
                .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
            }
            .padding(.top, 18)
        }
        .padding(.horizontal, 20)
        .padding(.top, 60)
        .padding(.bottom, 28)
        .background(
            Theme.purpleDeep
                .clipShape(.rect(bottomLeadingRadius: 28, bottomTrailingRadius: 28))
                .ignoresSafeArea(edges: .top)
        )
    }

    private func iconButton(_ name: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: name).font(.system(size: 18)).foregroundStyle(.white)
                .frame(width: 38, height: 38)
                .background(Color.white.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
        }
    }

    private var brandsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(leading: "Top", highlight: "Brands", actionTitle: "See All") {}
                .padding(.horizontal, 20)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(MockData.brands) { brand in
                        BrandCardView(brand: brand) {}
                    }
                }
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
        }
    }

    private var trendingSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(leading: "Trending", highlight: "Cars", actionTitle: "See All") { withAnimation { selectedTab = 1 } }
                .padding(.horizontal, 20)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(availableCars) { car in CarCardView(car: car) }
                }
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
        }
    }

    private var promoBanner: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("WEEKEND SPECIAL").font(.system(size: 10, weight: .heavy)).foregroundStyle(Theme.orange).tracking(1)
                Text("20% Off SUV Rentals").font(.system(size: 18, weight: .heavy)).foregroundStyle(.white)
                Text("Book any SUV this weekend & save big").font(.system(size: 12)).foregroundStyle(Theme.gray400)
                Button {
                    router.push(.marketplace)
                } label: {
                    Text("Book Now").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .background(Theme.orange, in: RoundedRectangle(cornerRadius: 10))
                }
                .padding(.top, 10)
            }
            .padding(18)
            Color.clear
                .frame(width: 140, height: 150)
                .overlay { RemoteImage(url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80").allowsHitTesting(false) }
                .clipped()
        }
        .frame(height: 150)
        .background(Theme.purpleDeep)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal, 20)
    }

    private var forSaleSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                (Text("Cars For ").foregroundStyle(Theme.gray900) + Text("Sale").foregroundStyle(Theme.orange))
                    .font(.system(size: 20, weight: .bold))
                Spacer()
                Button { router.push(.marketplace) } label: {
                    HStack(spacing: 2) {
                        Text("Marketplace").font(.system(size: 14, weight: .semibold))
                        Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(Theme.orange)
                }
            }
            .padding(.horizontal, 20)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(featuredSaleCars) { car in
                        SaleCarCardView(car: car) { router.push(.saleDetail(car.id)) }
                    }
                }
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
        }
    }

    private var nearYouSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(leading: "Near", highlight: "You")
                .padding(.horizontal, 20)
            VStack(spacing: 14) {
                ForEach(availableCars.prefix(3)) { car in
                    CarCardView(car: car, variant: .horizontal)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

/// Compact card for cars listed for sale, used in Home and Marketplace rails.
struct SaleCarCardView: View {
    let car: SaleCar
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                Color.clear
                    .frame(width: 200, height: 120)
                    .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                    .clipped()
                    .overlay(alignment: .topLeading) {
                        if car.isFeatured {
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles").font(.system(size: 9))
                                Text("Featured").font(.system(size: 10, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 10))
                            .padding(8)
                        }
                    }
                    .overlay(alignment: .bottomTrailing) {
                        Text(car.condition.rawValue).font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                            .padding(8)
                    }

                VStack(alignment: .leading, spacing: 1) {
                    Text(car.brand).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.gray500)
                    Text(car.model).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                    HStack(spacing: 4) {
                        Text("\(String(car.year))").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                        Text("·").foregroundStyle(Theme.gray400)
                        Text("\(car.mileage / 1000)k km").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                    }
                    .padding(.top, 4)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("GH₵").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.orange)
                        Text(formattedAmount(car.salePrice)).font(.system(size: 17, weight: .heavy)).foregroundStyle(Theme.gray900)
                    }
                    .padding(.top, 6)
                }
                .padding(12)
            }
            .frame(width: 200)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .shadow(color: .black.opacity(0.1), radius: 10, y: 3)
        }
        .buttonStyle(PressableStyle())
    }
}
