import SwiftUI

struct MarketplaceView: View {
    @Environment(Router.self) private var router
    @State private var query = ""
    @State private var condition: CarCondition? = nil
    @State private var brand: String? = nil

    private var brands: [String] { Array(Set(MockData.saleCars.map(\.brand))).sorted() }

    private var filtered: [SaleCar] {
        MockData.saleCars.filter { car in
            (query.isEmpty || car.brand.localizedCaseInsensitiveContains(query) || car.model.localizedCaseInsensitiveContains(query))
            && (condition == nil || car.condition == condition)
            && (brand == nil || car.brand == brand)
        }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                searchBar
                filterChips
                Text("\(filtered.count) cars for sale")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray600)
                    .padding(.horizontal, 20)
                LazyVStack(spacing: 16) {
                    ForEach(filtered) { car in
                        SaleListingCard(car: car) { router.push(.saleDetail(car.id)) }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .padding(.top, 8)
        }
        .background(Theme.gray50)
        .navigationTitle("Marketplace")
        .navigationBarTitleDisplayMode(.large)
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").foregroundStyle(Theme.gray400)
            TextField("Search cars for sale...", text: $query)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
        .padding(.horizontal, 20)
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach([CarCondition.new, .foreignUsed, .locallyUsed], id: \.self) { c in
                    chip(c.rawValue, isSelected: condition == c) { condition = condition == c ? nil : c }
                }
                Rectangle().fill(Theme.gray300).frame(width: 1, height: 24)
                ForEach(brands, id: \.self) { b in
                    chip(b, isSelected: brand == b) { brand = brand == b ? nil : b }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func chip(_ title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 13, weight: .semibold))
                .foregroundStyle(isSelected ? .white : Theme.gray700)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(isSelected ? Theme.orange : .white, in: Capsule())
                .overlay(Capsule().stroke(Theme.gray200, lineWidth: isSelected ? 0 : 1))
        }
    }
}

struct SaleListingCard: View {
    let car: SaleCar
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                Color.clear.frame(height: 180)
                    .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                    .clipped()
                    .overlay(alignment: .topLeading) {
                        if car.isFeatured {
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles").font(.system(size: 10))
                                Text("Featured").font(.system(size: 11, weight: .bold))
                            }
                            .foregroundStyle(.white).padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Theme.orange, in: Capsule()).padding(10)
                        }
                    }
                    .overlay(alignment: .topTrailing) {
                        Text(car.condition.rawValue).font(.system(size: 11, weight: .semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Color.black.opacity(0.6), in: Capsule()).padding(10)
                    }

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(car.brand).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                            Text(car.model).font(.system(size: 17, weight: .bold)).foregroundStyle(Theme.gray900)
                        }
                        Spacer()
                        HStack(alignment: .firstTextBaseline, spacing: 2) {
                            Text("GH₵").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.orange)
                            Text(formattedAmount(car.salePrice)).font(.system(size: 19, weight: .heavy)).foregroundStyle(Theme.gray900)
                        }
                    }
                    HStack(spacing: 12) {
                        specPill("calendar", String(car.year))
                        specPill("gauge.high", "\(car.mileage / 1000)k km")
                        specPill("fuelpump.fill", car.fuelType.rawValue)
                        specPill("mappin", car.location)
                    }
                }
                .padding(14)
            }
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .shadow(color: .black.opacity(0.08), radius: 10, y: 3)
        }
        .buttonStyle(PressableStyle())
    }

    private func specPill(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 3) {
            Image(systemName: icon).font(.system(size: 10)).foregroundStyle(Theme.gray500)
            Text(text).font(.system(size: 11)).foregroundStyle(Theme.gray600).lineLimit(1)
        }
    }
}
