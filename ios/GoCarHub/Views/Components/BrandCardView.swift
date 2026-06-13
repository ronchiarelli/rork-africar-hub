import SwiftUI

/// Brand logo chip used in the Home "Top Brands" rail.
struct BrandCardView: View {
    let brand: Brand
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                RemoteImage(url: brand.logo, contentMode: .fit)
                    .frame(width: 40, height: 40)
                    .padding(14)
                    .background(.white, in: RoundedRectangle(cornerRadius: 18))
                    .shadow(color: .black.opacity(0.06), radius: 6, y: 2)
                Text(brand.name)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.gray700)
                Text("\(brand.carCount) cars")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.gray400)
            }
            .frame(width: 76)
        }
        .buttonStyle(PressableStyle())
    }
}

/// Reusable section header with a highlighted second word, e.g. "Trending Cars".
struct SectionHeader: View {
    let leading: String
    let highlight: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack {
            (Text(leading + " ").foregroundStyle(Theme.gray900)
                + Text(highlight).foregroundStyle(Theme.orange))
                .font(.system(size: 20, weight: .bold))
            Spacer()
            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.orange)
                }
            }
        }
    }
}
