import SwiftUI

struct SearchView: View {
    @Environment(Router.self) private var router
    @State private var query = ""
    @State private var selectedCategory: String? = nil
    @State private var selectedTransmission: Transmission? = nil
    @State private var selectedLocation: String? = nil
    @State private var maxPrice: Double = 1500

    private let categories = ["SUV", "Sedan"]

    private var filtered: [Car] {
        MockData.cars.filter { car in
            (query.isEmpty || car.brand.localizedCaseInsensitiveContains(query) || car.model.localizedCaseInsensitiveContains(query))
            && (selectedCategory == nil || car.category == selectedCategory)
            && (selectedTransmission == nil || car.transmission == selectedTransmission)
            && (selectedLocation == nil || car.location == selectedLocation)
            && Double(car.pricePerDay) <= maxPrice
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    filterGroup("Category") {
                        chipRow(items: categories, selected: selectedCategory) { item in
                            selectedCategory = selectedCategory == item ? nil : item
                        }
                    }
                    filterGroup("Transmission") {
                        chipRow(items: [Transmission.automatic.rawValue, Transmission.manual.rawValue],
                                selected: selectedTransmission?.rawValue) { item in
                            let t = Transmission(rawValue: item)
                            selectedTransmission = selectedTransmission == t ? nil : t
                        }
                    }
                    filterGroup("Max Price — GH₵ \(Int(maxPrice))/day") {
                        Slider(value: $maxPrice, in: 300...1500, step: 50).tint(Theme.orange)
                    }
                    filterGroup("Location") {
                        chipFlow(items: MockData.locations, selected: selectedLocation) { item in
                            selectedLocation = selectedLocation == item ? nil : item
                        }
                    }
                }
                .padding(20)
                .background(Theme.gray50)
                .clipShape(.rect(topLeadingRadius: 28, topTrailingRadius: 28))

                HStack {
                    Text("\(filtered.count) cars found").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Spacer()
                    Button("Reset") {
                        selectedCategory = nil; selectedTransmission = nil; selectedLocation = nil
                        maxPrice = 1500; query = ""
                    }
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
                }
                .padding(.horizontal, 20)

                VStack(spacing: 14) {
                    ForEach(filtered) { car in
                        CarCardView(car: car, variant: .horizontal)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
        .background(Theme.gray50)
        .ignoresSafeArea(edges: .top)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Search").font(.system(size: 28, weight: .heavy)).foregroundStyle(.white)
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.gray400)
                TextField("", text: $query, prompt: Text("Search cars, brands...").foregroundColor(Theme.gray400))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 16).padding(.vertical, 14)
            .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal, 20)
        .padding(.top, 60)
        .padding(.bottom, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.purpleDeep.ignoresSafeArea(edges: .top))
    }

    @ViewBuilder
    private func filterGroup<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.gray800)
            content()
        }
    }

    private func chipRow(items: [String], selected: String?, onTap: @escaping (String) -> Void) -> some View {
        HStack(spacing: 10) {
            ForEach(items, id: \.self) { item in chip(item, isSelected: selected == item) { onTap(item) } }
        }
    }

    private func chipFlow(items: [String], selected: String?, onTap: @escaping (String) -> Void) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { item in chip(item, isSelected: selected == item) { onTap(item) } }
        }
    }

    private func chip(_ title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(isSelected ? .white : Theme.gray700)
                .padding(.horizontal, 14).padding(.vertical, 9)
                .background(isSelected ? Theme.orange : .white, in: Capsule())
                .overlay(Capsule().stroke(Theme.gray200, lineWidth: isSelected ? 0 : 1))
        }
    }
}
