import SwiftUI

enum CarCardVariant {
    case vertical
    case horizontal
}

/// Reusable car card mirroring the Expo CarCard component.
struct CarCardView: View {
    let car: Car
    var variant: CarCardVariant = .vertical
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router

    private var favorited: Bool { app.isFavorite(car.id) }

    var body: some View {
        Button {
            router.push(.carDetails(car.id))
        } label: {
            content
        }
        .buttonStyle(PressableStyle())
    }

    @ViewBuilder
    private var content: some View {
        if variant == .horizontal {
            horizontalCard
        } else {
            verticalCard
        }
    }

    private var heartButton: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                app.toggleFavorite(car.id)
            }
        } label: {
            Image(systemName: favorited ? "heart.fill" : "heart")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(favorited ? Theme.orange : .white)
                .frame(width: 32, height: 32)
                .background(Color.black.opacity(0.3), in: Circle())
        }
        .buttonStyle(.plain)
    }

    private var verticalCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Color.black.opacity(0.001)
                .frame(width: 220, height: 140)
                .overlay {
                    RemoteImage(url: car.image).allowsHitTesting(false)
                }
                .clipped()
                .overlay(alignment: .topTrailing) { heartButton.padding(10) }
                .overlay(alignment: .bottomLeading) {
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(Theme.star)
                        Text(String(format: "%.1f", car.rating))
                            .font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                    }
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.black.opacity(0.6), in: Capsule())
                    .padding(8)
                }

            VStack(alignment: .leading, spacing: 0) {
                Text(car.brand).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.gray500)
                Text(car.model).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                    .lineLimit(1).padding(.top, 2)
                HStack {
                    priceRow
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Theme.orange, in: RoundedRectangle(cornerRadius: 12))
                }
                .padding(.top, 10)
            }
            .padding(14)
        }
        .frame(width: 220)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.1), radius: 12, y: 4)
    }

    private var horizontalCard: some View {
        HStack(spacing: 0) {
            Color.black.opacity(0.001)
                .frame(width: 130, height: 120)
                .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                .clipped()
                .overlay(alignment: .topTrailing) { heartButton.padding(8) }

            VStack(alignment: .leading, spacing: 0) {
                Text(car.brand).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.gray500)
                Text(car.model).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                HStack(spacing: 4) {
                    Image(systemName: "mappin").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                    Text(car.location).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
                .padding(.top, 4)
                priceRow.padding(.top, 6)
            }
            .padding(12)
            Spacer(minLength: 0)
        }
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.08), radius: 8, y: 2)
    }

    private var priceRow: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("GH₵").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.orange)
            Text("\(car.pricePerDay)").font(.system(size: 20, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text("/day").font(.system(size: 12)).foregroundStyle(Theme.gray500)
        }
    }
}

/// Scale-down press effect used across tappable cards.
struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
