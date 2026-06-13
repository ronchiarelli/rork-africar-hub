import SwiftUI

struct LoginView: View {
    @Environment(AppState.self) private var app
    @State private var email = "kwaku.mensah@email.com"
    @State private var password = "password"
    @State private var showPassword = false

    var body: some View {
        ZStack {
            Theme.purpleDeep.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 10) {
                        Image(systemName: "car.fill").font(.system(size: 28)).foregroundStyle(Theme.orange)
                        Text("AutoRide").font(.system(size: 22, weight: .heavy)).foregroundStyle(.white)
                    }
                    .padding(.top, 20)

                    Text("Welcome Back").font(.system(size: 32, weight: .black)).foregroundStyle(.white).padding(.top, 32)
                    Text("Sign in to continue your journey").font(.system(size: 15)).foregroundStyle(Theme.gray400).padding(.top, 6)

                    VStack(spacing: 16) {
                        AuthField(icon: "envelope.fill", placeholder: "Email address", text: $email, keyboard: .emailAddress)
                        AuthSecureField(placeholder: "Password", text: $password, showPassword: $showPassword)
                    }
                    .padding(.top, 36)

                    HStack {
                        Spacer()
                        Button("Forgot Password?") {}
                            .font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.orange)
                    }
                    .padding(.top, 14)

                    Button {
                        app.login()
                    } label: {
                        Text("Sign In")
                            .font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 18)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(PressableStyle())
                    .padding(.top, 28)

                    HStack(spacing: 4) {
                        Spacer()
                        Text("Don't have an account?").font(.system(size: 14)).foregroundStyle(Theme.gray400)
                        NavigationLink {
                            RegisterView()
                        } label: {
                            Text("Sign Up").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.orange)
                        }
                        Spacer()
                    }
                    .padding(.top, 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct AuthField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(Theme.gray400).frame(width: 20)
            TextField("", text: $text, prompt: Text(placeholder).foregroundColor(Theme.gray500))
                .foregroundStyle(.white)
                .keyboardType(keyboard)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 16).padding(.vertical, 16)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
}

struct AuthSecureField: View {
    let placeholder: String
    @Binding var text: String
    @Binding var showPassword: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "lock.fill").font(.system(size: 16)).foregroundStyle(Theme.gray400).frame(width: 20)
            Group {
                if showPassword {
                    TextField("", text: $text, prompt: Text(placeholder).foregroundColor(Theme.gray500))
                } else {
                    SecureField("", text: $text, prompt: Text(placeholder).foregroundColor(Theme.gray500))
                }
            }
            .foregroundStyle(.white)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            Button {
                showPassword.toggle()
            } label: {
                Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 15)).foregroundStyle(Theme.gray400)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 16)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
}
