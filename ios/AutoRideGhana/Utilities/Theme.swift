import SwiftUI

/// Central color palette mirroring the Expo app's deep-purple + vibrant-orange aesthetic.
enum Theme {
    // Purple scale
    static let purpleDeep = Color(hex: "1A0A2E")
    static let purpleDark = Color(hex: "2D1452")
    static let purpleMedium = Color(hex: "4A2080")
    static let purpleLight = Color(hex: "6B3FA0")
    static let purpleSoft = Color(hex: "8B5FBF")
    static let purpleMuted = Color(hex: "B08AD4")
    static let purpleFaint = Color(hex: "E8DFF0")

    // Orange scale
    static let orange = Color(hex: "FF6B2C")
    static let orangeBright = Color(hex: "FF8548")
    static let orangeSoft = Color(hex: "FFA06E")
    static let orangeLight = Color(hex: "FFD4BC")
    static let orangeFaint = Color(hex: "FFF0E8")

    // Gray scale
    static let gray50 = Color(hex: "FAFAFA")
    static let gray100 = Color(hex: "F5F5F5")
    static let gray200 = Color(hex: "EEEEEE")
    static let gray300 = Color(hex: "E0E0E0")
    static let gray400 = Color(hex: "BDBDBD")
    static let gray500 = Color(hex: "9E9E9E")
    static let gray600 = Color(hex: "757575")
    static let gray700 = Color(hex: "616161")
    static let gray800 = Color(hex: "424242")
    static let gray900 = Color(hex: "212121")

    static let star = Color(hex: "FFB800")
    static let success = Color(hex: "22C55E")
    static let error = Color(hex: "EF4444")
    static let warning = Color(hex: "F59E0B")
    static let info = Color(hex: "3B82F6")
    static let whatsapp = Color(hex: "25D366")

    static let bgGradient = LinearGradient(
        colors: [purpleDeep, purpleDark],
        startPoint: .top,
        endPoint: .bottom
    )
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

/// Format a number with thousands separators, e.g. 285000 -> "285,000".
func formattedAmount(_ value: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.groupingSeparator = ","
    return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
}
