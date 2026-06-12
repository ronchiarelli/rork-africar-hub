import SwiftUI

struct FavoritesView: View {
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router

    var body: some View {
        Group {
            if app.favoriteCars.isEmpty {
                VStack(spacing: 14) {
                    Image(systemName: "heart.slash").font(.system(size: 52)).foregroundStyle(Theme.gray300)
                    Text("No favorites yet").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray700)
                    Text("Tap the heart on any car to save it here.")
                        .font(.system(size: 14)).foregroundStyle(Theme.gray400).multilineTextAlignment(.center)
                    Button {
                        router.pop()
                    } label: {
                        Text("Explore Cars").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 24).padding(.vertical, 12)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        ForEach(app.favoriteCars) { car in
                            CarCardView(car: car, variant: .horizontal)
                        }
                    }
                    .padding(20)
                }
            }
        }
        .background(Theme.gray50)
        .navigationTitle("My Favorites")
        .navigationBarTitleDisplayMode(.large)
    }
}
