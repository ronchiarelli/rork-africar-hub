import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var app
    @State private var pushNotifications = true
    @State private var emailNotifications = false
    @State private var promoNotifications = true
    @State private var biometric = true
    @State private var twoFactor = false
    @State private var darkMode = false
    @State private var language = "English"
    @State private var showLogout = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                section("Notifications") {
                    toggleRow("bell.fill", Theme.orange, "Push Notifications", $pushNotifications)
                    toggleRow("envelope.fill", Theme.info, "Email Notifications", $emailNotifications)
                    toggleRow("tag.fill", Theme.success, "Promotions & Offers", $promoNotifications)
                }
                section("Security") {
                    toggleRow("faceid", Theme.purpleMedium, "Biometric Login", $biometric)
                    toggleRow("lock.shield.fill", Theme.error, "Two-Factor Authentication", $twoFactor)
                }
                section("Appearance") {
                    toggleRow("moon.fill", Theme.gray700, "Dark Mode", $darkMode)
                    Menu {
                        ForEach(["English", "Twi", "Ga", "French"], id: \.self) { lang in
                            Button(lang) { language = lang }
                        }
                    } label: {
                        settingRow("globe", Theme.info, "Language", trailing: language)
                    }
                }
                section("About") {
                    linkRow("doc.text.fill", Theme.gray600, "Terms of Service")
                    linkRow("hand.raised.fill", Theme.gray600, "Privacy Policy")
                    settingRow("info.circle.fill", Theme.gray600, "Version", trailing: "1.0.0")
                }
                Button {
                    showLogout = true
                } label: {
                    HStack {
                        Image(systemName: "arrow.right.square.fill")
                        Text("Logout").font(.system(size: 15, weight: .bold))
                        Spacer()
                    }
                    .foregroundStyle(Theme.error)
                    .padding(16)
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
                }
                .buttonStyle(.plain)
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Logout", isPresented: $showLogout) {
            Button("Cancel", role: .cancel) {}
            Button("Logout", role: .destructive) { app.logout() }
        } message: { Text("Are you sure you want to logout?") }
    }

    @ViewBuilder
    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased()).font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.gray500).tracking(0.5)
            VStack(spacing: 0) { content() }
                .background(.white, in: RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
        }
    }

    private func toggleRow(_ icon: String, _ color: Color, _ label: String, _ binding: Binding<Bool>) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color).frame(width: 24)
            Text(label).font(.system(size: 15)).foregroundStyle(Theme.gray800)
            Spacer()
            Toggle("", isOn: binding).labelsHidden().tint(Theme.orange)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func settingRow(_ icon: String, _ color: Color, _ label: String, trailing: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color).frame(width: 24)
            Text(label).font(.system(size: 15)).foregroundStyle(Theme.gray800)
            Spacer()
            Text(trailing).font(.system(size: 14)).foregroundStyle(Theme.gray500)
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Theme.gray400)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func linkRow(_ icon: String, _ color: Color, _ label: String) -> some View {
        Button {} label: { settingRow(icon, color, label, trailing: "") }.buttonStyle(.plain)
    }
}
