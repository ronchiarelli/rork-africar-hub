import SwiftUI

struct HelpView: View {
    @State private var expandedFAQ: Int? = nil
    @State private var message = ""

    private let faqs: [(String, String)] = [
        ("How do I book a car?", "Browse cars on the Home or Search screen, tap a car to view details, then tap 'Rent Now'. Select your dates and location, then complete payment."),
        ("What payment methods are accepted?", "We accept MTN Mobile Money, Vodafone Cash, AirtelTigo Money, Visa/Mastercard, and your AutoRide Wallet balance."),
        ("How does KYC verification work?", "Upload your Ghana Card, Driver's License, or Passport plus a selfie. Our team reviews documents within 24 hours."),
        ("Can I cancel a booking?", "Yes. Go to My Bookings, open the booking, and request a cancellation. Refunds are processed to your wallet within 3-5 days."),
        ("How do I list my car for rent?", "Switch to a Fleet Owner account from your Profile, then add your vehicles through the Fleet Dashboard."),
        ("Is my payment information secure?", "Absolutely. All transactions are encrypted end-to-end and we never store your full card details."),
        ("How do I contact a car owner?", "On any car details page, use the WhatsApp or Call buttons in the 'Listed By' section to reach the owner directly."),
    ]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                HStack(spacing: 12) {
                    contactButton("message.fill", Theme.whatsapp, "WhatsApp", "https://wa.me/233201234567")
                    contactButton("phone.fill", Theme.info, "Call Us", "tel:+233201234567")
                    contactButton("envelope.fill", Theme.orange, "Email", "mailto:support@autoride.gh")
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Frequently Asked").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                    VStack(spacing: 0) {
                        ForEach(Array(faqs.enumerated()), id: \.offset) { idx, faq in
                            faqRow(idx, faq)
                            if idx < faqs.count - 1 { Divider() }
                        }
                    }
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Send Us a Message").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                    TextEditor(text: $message)
                        .frame(height: 120).scrollContentBackground(.hidden)
                        .padding(12).background(Theme.gray100, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(alignment: .topLeading) {
                            if message.isEmpty {
                                Text("Describe your issue...").font(.system(size: 14)).foregroundStyle(Theme.gray400)
                                    .padding(18).allowsHitTesting(false)
                            }
                        }
                    Button {
                        message = ""
                    } label: {
                        Text("Send Message").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 16)
                            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 14))
                    }
                    .buttonStyle(PressableStyle())
                }
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func contactButton(_ icon: String, _ color: Color, _ label: String, _ url: String) -> some View {
        Button {
            if let u = URL(string: url) { UIApplication.shared.open(u) }
        } label: {
            VStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 22)).foregroundStyle(.white)
                    .frame(width: 52, height: 52).background(color, in: RoundedRectangle(cornerRadius: 16))
                Text(label).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.gray700)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(PressableStyle())
    }

    private func faqRow(_ idx: Int, _ faq: (String, String)) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.25)) { expandedFAQ = expandedFAQ == idx ? nil : idx }
            } label: {
                HStack {
                    Text(faq.0).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.gray900)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: "chevron.down").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.orange)
                        .rotationEffect(.degrees(expandedFAQ == idx ? 180 : 0))
                }
                .padding(16)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            if expandedFAQ == idx {
                Text(faq.1).font(.system(size: 14)).foregroundStyle(Theme.gray600).lineSpacing(4)
                    .padding(.horizontal, 16).padding(.bottom, 16)
            }
        }
    }
}
