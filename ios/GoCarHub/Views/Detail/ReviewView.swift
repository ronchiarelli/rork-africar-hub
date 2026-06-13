import SwiftUI

struct ReviewView: View {
    let carId: String
    @Environment(Router.self) private var router
    @State private var rating = 5
    @State private var reviewText = ""
    @State private var selectedTags: Set<String> = []
    @State private var submitted = false

    private let tags = ["Clean", "On Time", "Great Condition", "Friendly Owner", "Smooth Ride", "Value for Money"]
    private var car: Car? { MockData.cars.first { $0.id == carId } }

    var body: some View {
        Group {
            if submitted {
                successView
            } else {
                form
            }
        }
        .background(Theme.gray50)
        .navigationTitle(submitted ? "" : "Write a Review")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var form: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                if let car {
                    HStack(spacing: 12) {
                        Color.clear.frame(width: 70, height: 56)
                            .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(car.brand).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                            Text(car.model).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
                }

                VStack(spacing: 14) {
                    Text("How was your trip?").font(.system(size: 17, weight: .bold)).foregroundStyle(Theme.gray900)
                    HStack(spacing: 10) {
                        ForEach(1...5, id: \.self) { star in
                            Button {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) { rating = star }
                            } label: {
                                Image(systemName: star <= rating ? "star.fill" : "star")
                                    .font(.system(size: 34)).foregroundStyle(star <= rating ? Theme.star : Theme.gray300)
                                    .scaleEffect(star == rating ? 1.15 : 1)
                            }
                        }
                    }
                    Text(ratingLabel).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.orange)
                }
                .frame(maxWidth: .infinity)
                .padding(20)
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick Tags").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                    FlowLayout(spacing: 8) {
                        ForEach(tags, id: \.self) { tag in
                            Button {
                                if selectedTags.contains(tag) { selectedTags.remove(tag) } else { selectedTags.insert(tag) }
                            } label: {
                                Text(tag).font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(selectedTags.contains(tag) ? .white : Theme.gray700)
                                    .padding(.horizontal, 14).padding(.vertical, 9)
                                    .background(selectedTags.contains(tag) ? Theme.orange : Theme.gray100, in: Capsule())
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Your Review").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                    TextEditor(text: $reviewText)
                        .frame(height: 120).scrollContentBackground(.hidden)
                        .padding(12).background(Theme.gray100, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(alignment: .topLeading) {
                            if reviewText.isEmpty {
                                Text("Share details of your experience...")
                                    .font(.system(size: 14)).foregroundStyle(Theme.gray400).padding(18).allowsHitTesting(false)
                            }
                        }
                }
                .padding(16)
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)

                Button {
                    withAnimation(.spring) { submitted = true }
                } label: {
                    Text("Submit Review").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 18)
                        .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(PressableStyle())
            }
            .padding(20)
        }
    }

    private var ratingLabel: String {
        switch rating {
        case 1: return "Poor"
        case 2: return "Fair"
        case 3: return "Good"
        case 4: return "Very Good"
        default: return "Excellent"
        }
    }

    private var successView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "checkmark.seal.fill").font(.system(size: 80)).foregroundStyle(Theme.success)
            Text("Thank You!").font(.system(size: 26, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text("Your review has been submitted successfully.")
                .font(.system(size: 15)).foregroundStyle(Theme.gray500).multilineTextAlignment(.center)
            Spacer()
            Button {
                router.pop()
            } label: {
                Text("Done").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 18)
                    .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(PressableStyle())
            .padding(.horizontal, 20).padding(.bottom, 30)
        }
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
