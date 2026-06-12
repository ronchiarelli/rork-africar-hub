import SwiftUI

struct PaymentView: View {
    let carId: String
    let days: Int
    let total: Int
    let location: String
    @Environment(AppState.self) private var app
    @Environment(Router.self) private var router
    @State private var selectedMethod = "pm1"
    @State private var processing = false
    @State private var success = false

    private var car: Car? { MockData.cars.first { $0.id == carId } }

    var body: some View {
        Group {
            if success {
                successScreen
            } else {
                paymentForm
            }
        }
        .navigationTitle(success ? "" : "Payment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(success ? .hidden : .visible, for: .navigationBar)
    }

    private var paymentForm: some View {
        ZStack(alignment: .bottom) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    if let car {
                        orderSummary(car)
                    }
                    methodSection
                    secureNote
                    Color.clear.frame(height: 100)
                }
                .padding(20)
            }
            payBar
        }
        .background(Theme.gray50)
    }

    private func orderSummary(_ car: Car) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Order Summary").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            HStack(spacing: 12) {
                Color.clear.frame(width: 70, height: 56)
                    .overlay { RemoteImage(url: car.image).allowsHitTesting(false) }
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(car.brand) \(car.model)").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                    Text("\(days) days · \(location)").font(.system(size: 12)).foregroundStyle(Theme.gray500)
                }
                Spacer()
            }
            Divider()
            HStack {
                Text("Total Amount").font(.system(size: 14)).foregroundStyle(Theme.gray600)
                Spacer()
                Text("GH₵ \(formattedAmount(total))").font(.system(size: 18, weight: .heavy)).foregroundStyle(Theme.gray900)
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private var methodSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Payment Method").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            VStack(spacing: 10) {
                ForEach(MockData.paymentMethods) { method in
                    Button {
                        selectedMethod = method.id
                    } label: {
                        HStack(spacing: 12) {
                            Text(method.icon).font(.system(size: 24))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(method.label).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.gray900)
                                if let details = method.details {
                                    Text(details).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                                }
                            }
                            Spacer()
                            Image(systemName: selectedMethod == method.id ? "largecircle.fill.circle" : "circle")
                                .font(.system(size: 20)).foregroundStyle(selectedMethod == method.id ? Theme.orange : Theme.gray300)
                        }
                        .padding(14)
                        .background(.white, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(selectedMethod == method.id ? Theme.orange : Theme.gray200, lineWidth: selectedMethod == method.id ? 2 : 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var secureNote: some View {
        HStack(spacing: 8) {
            Image(systemName: "lock.shield.fill").font(.system(size: 14)).foregroundStyle(Theme.success)
            Text("Your payment is secured with end-to-end encryption.")
                .font(.system(size: 12)).foregroundStyle(Theme.gray500)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.success.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }

    private var payBar: some View {
        Button {
            processing = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                processing = false
                withAnimation(.spring) { success = true }
            }
        } label: {
            HStack {
                if processing {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: "lock.fill").font(.system(size: 15, weight: .bold))
                    Text("Pay GH₵ \(formattedAmount(total))").font(.system(size: 17, weight: .bold))
                }
            }
            .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 18)
            .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(PressableStyle())
        .disabled(processing)
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 30)
        .background(.white.ignoresSafeArea())
        .shadow(color: .black.opacity(0.08), radius: 10, y: -4)
    }

    private var successScreen: some View {
        VStack(spacing: 0) {
            Spacer()
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 90)).foregroundStyle(Theme.success)
                .padding(.bottom, 24)
            Text("Payment Successful!").font(.system(size: 26, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text("Your booking is confirmed. Get ready for your ride!")
                .font(.system(size: 15)).foregroundStyle(Theme.gray500)
                .multilineTextAlignment(.center).padding(.horizontal, 40).padding(.top, 8)

            VStack(spacing: 12) {
                HStack {
                    Text("Amount Paid").font(.system(size: 14)).foregroundStyle(Theme.gray600)
                    Spacer()
                    Text("GH₵ \(formattedAmount(total))").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
                }
                Divider()
                HStack {
                    Text("Reference").font(.system(size: 14)).foregroundStyle(Theme.gray600)
                    Spacer()
                    Text("AR-\(carId)\(days)\(total % 1000)").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray800)
                }
            }
            .padding(16)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
            .padding(.horizontal, 30).padding(.top, 28)

            Spacer()
            Button {
                router.popToRoot()
            } label: {
                Text("Done").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 18)
                    .background(Theme.orange, in: RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(PressableStyle())
            .padding(.horizontal, 20).padding(.bottom, 30)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.gray50)
    }
}
