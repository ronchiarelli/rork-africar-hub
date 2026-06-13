import SwiftUI

/// Image loader that checks the asset catalog first, then falls back to URL.
struct RemoteImage: View {
    let url: String
    var contentMode: ContentMode = .fill

    var body: some View {
        if let _ = UIImage(named: url) {
            Image(url)
                .resizable()
                .aspectRatio(contentMode: contentMode)
        } else if let validURL = URL(string: url) {
            AsyncImage(url: validURL) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                case .failure:
                    fallback
                default:
                    shimmer
                }
            }
        } else {
            fallback
        }
    }

    private var fallback: some View {
        Theme.gray200
            .overlay {
                Image(systemName: "car.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(Theme.gray400)
            }
    }

    private var shimmer: some View {
        Theme.gray100
            .overlay { ProgressView().tint(Theme.gray400) }
    }
}
