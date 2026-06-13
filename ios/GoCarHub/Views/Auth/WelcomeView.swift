import SwiftUI

struct WelcomeView: View {
    @Environment(AppState.self) private var app
    @State private var route: AuthRoute?
    @State private var appeared = false

    enum AuthRoute: Hashable { case login, register }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.opacity(0.001)
                    .overlay {
                        RemoteImage(url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80")
                            .allowsHitTesting(false)
                    }
                    .ignoresSafeArea()
                Color(hex: "1A0A2E").opacity(0.82).ignoresSafeArea()

                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 10) {
                        Image(systemName: "car.fill")
                            .font(.system(size: 30)).foregroundStyle(Theme.orange)
                        Text("AutoRide")
                            .font(.system(size: 24, weight: .heavy)).foregroundStyle(.white)
                    }
                    .padding(.top, 40)

                    Spacer()

                    VStack(alignment: .leading, spacing: 14) {
                        Text("Premium Car\nRental in Ghana")
                            .font(.system(size: 40, weight: .black))
                            .foregroundStyle(.white)
                            .lineSpacing(6)
                        Text("Discover luxury vehicles, book seamlessly, and hit the road with confidence.")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.gray400)
                            .lineSpacing(4)
                    }
                    .padding(.bottom, 40)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 40)

                    VStack(spacing: 8) {
                        Button {
                            route = .register
                        } label: {
                            HStack(spacing: 6) {
                                Text("Get Started").font(.system(size: 17, weight: .bold))
                                Image(systemName: "chevron.right").font(.system(size: 16, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
                        }
                        .buttonStyle(PressableStyle())

                        Button {
                            route = .login
                        } label: {
                            Text("I already have an account")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Theme.gray400)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        }
                    }
                    .padding(.bottom, 20)
                }
                .padding(.horizontal, 24)
            }
            .navigationDestination(item: $route) { r in
                switch r {
                case .login: LoginView()
                case .register: RegisterView()
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) { appeared = true }
        }
    }
}
