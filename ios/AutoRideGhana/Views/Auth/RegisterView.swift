import SwiftUI

struct RegisterView: View {
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var goToOTP = false

    var body: some View {
        ZStack {
            Theme.purpleDeep.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Create Account").font(.system(size: 32, weight: .black)).foregroundStyle(.white).padding(.top, 24)
                    Text("Join AutoRide and start renting").font(.system(size: 15)).foregroundStyle(Theme.gray400).padding(.top, 6)

                    VStack(spacing: 16) {
                        AuthField(icon: "person.fill", placeholder: "Full name", text: $name)
                        AuthField(icon: "envelope.fill", placeholder: "Email address", text: $email, keyboard: .emailAddress)
                        AuthField(icon: "phone.fill", placeholder: "Phone number", text: $phone, keyboard: .phonePad)
                        AuthSecureField(placeholder: "Password", text: $password, showPassword: $showPassword)
                    }
                    .padding(.top, 32)

                    Button {
                        goToOTP = true
                    } label: {
                        Text("Create Account")
                            .font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 18)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(PressableStyle())
                    .padding(.top, 28)

                    Text("By continuing you agree to our Terms of Service and Privacy Policy.")
                        .font(.system(size: 12)).foregroundStyle(Theme.gray500)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 18)
                }
                .padding(.horizontal, 24)
            }
        }
        .navigationDestination(isPresented: $goToOTP) {
            OTPVerifyView(phone: phone.isEmpty ? "+233 24 123 4567" : phone)
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}
