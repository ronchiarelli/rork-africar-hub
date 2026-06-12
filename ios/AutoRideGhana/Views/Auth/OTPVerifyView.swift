import SwiftUI
import Combine

struct OTPVerifyView: View {
    let phone: String
    @Environment(AppState.self) private var app
    @State private var digits: [String] = ["", "", "", ""]
    @State private var countdown = 30
    @FocusState private var focused: Int?
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var code: String { digits.joined() }
    private var isComplete: Bool { code.count == 4 }

    var body: some View {
        ZStack {
            Theme.purpleDeep.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 0) {
                Image(systemName: "envelope.badge.fill")
                    .font(.system(size: 44)).foregroundStyle(Theme.orange)
                    .padding(.top, 24)
                Text("Verify Your Number").font(.system(size: 30, weight: .black)).foregroundStyle(.white).padding(.top, 24)
                Text("Enter the 4-digit code sent to\n\(phone)")
                    .font(.system(size: 15)).foregroundStyle(Theme.gray400).lineSpacing(3).padding(.top, 8)

                HStack(spacing: 14) {
                    ForEach(0..<4, id: \.self) { i in
                        TextField("", text: $digits[i])
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.center)
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 60, height: 66)
                            .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                            .overlay(RoundedRectangle(cornerRadius: 16)
                                .stroke(focused == i ? Theme.orange : Color.white.opacity(0.1), lineWidth: 1.5))
                            .focused($focused, equals: i)
                            .onChange(of: digits[i]) { _, newValue in
                                if newValue.count > 1 { digits[i] = String(newValue.prefix(1)) }
                                if !newValue.isEmpty && i < 3 { focused = i + 1 }
                            }
                    }
                }
                .padding(.top, 40)

                Button {
                    app.login()
                } label: {
                    Text("Verify")
                        .font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 18)
                        .background(isComplete ? Theme.orange : Theme.orange.opacity(0.4), in: RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(PressableStyle())
                .disabled(!isComplete)
                .padding(.top, 36)

                HStack(spacing: 4) {
                    Spacer()
                    if countdown > 0 {
                        Text("Resend code in \(countdown)s").font(.system(size: 14)).foregroundStyle(Theme.gray400)
                    } else {
                        Button("Resend Code") { countdown = 30 }
                            .font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.orange)
                    }
                    Spacer()
                }
                .padding(.top, 24)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onReceive(timer) { _ in if countdown > 0 { countdown -= 1 } }
        .onAppear { focused = 0 }
        .toolbar(.hidden, for: .navigationBar)
    }
}
