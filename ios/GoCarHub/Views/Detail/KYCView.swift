import SwiftUI

struct KYCView: View {
    @State private var documents = MockData.kycDocuments

    private var verifiedCount: Int { documents.filter { $0.status == .verified }.count }
    private var progress: Double { Double(verifiedCount) / Double(documents.count) }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                progressCard
                VStack(spacing: 12) {
                    ForEach($documents) { $doc in
                        docRow($doc)
                    }
                }
                infoNote
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("KYC Verification")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var progressCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Verification Progress").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    Text("\(verifiedCount) of \(documents.count) documents verified")
                        .font(.system(size: 13)).foregroundStyle(.white.opacity(0.7))
                }
                Spacer()
                Text("\(Int(progress * 100))%").font(.system(size: 28, weight: .heavy)).foregroundStyle(Theme.orange)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.15)).frame(height: 8)
                    Capsule().fill(Theme.orange).frame(width: geo.size.width * progress, height: 8)
                }
            }
            .frame(height: 8)
        }
        .padding(18)
        .background(Theme.purpleDeep, in: RoundedRectangle(cornerRadius: 18))
    }

    private func docRow(_ doc: Binding<KYCDocument>) -> some View {
        HStack(spacing: 14) {
            Image(systemName: iconFor(doc.wrappedValue.type)).font(.system(size: 20)).foregroundStyle(Theme.purpleMedium)
                .frame(width: 48, height: 48).background(Theme.purpleFaint, in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 3) {
                Text(doc.wrappedValue.label).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900)
                statusChip(doc.wrappedValue.status)
            }
            Spacer()
            if doc.wrappedValue.status == .notUploaded {
                Button {
                    withAnimation { doc.wrappedValue.status = .uploaded; doc.wrappedValue.uploadedAt = "2026-06-12" }
                } label: {
                    Text("Upload").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 9)
                        .background(Theme.orange, in: Capsule())
                }
            } else if doc.wrappedValue.status == .verified {
                Image(systemName: "checkmark.circle.fill").font(.system(size: 24)).foregroundStyle(Theme.success)
            } else {
                Image(systemName: "clock.fill").font(.system(size: 20)).foregroundStyle(Theme.warning)
            }
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func statusChip(_ status: KYCStatus) -> some View {
        let (text, color): (String, Color) = {
            switch status {
            case .verified: return ("Verified", Theme.success)
            case .uploaded: return ("Under Review", Theme.warning)
            case .rejected: return ("Rejected", Theme.error)
            case .notUploaded: return ("Not Uploaded", Theme.gray500)
            }
        }()
        return Text(text).font(.system(size: 11, weight: .semibold)).foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.12), in: Capsule())
    }

    private var infoNote: some View {
        HStack(spacing: 10) {
            Image(systemName: "info.circle.fill").font(.system(size: 16)).foregroundStyle(Theme.info)
            Text("Your documents are encrypted and reviewed within 24 hours. Verification unlocks all rental features.")
                .font(.system(size: 12)).foregroundStyle(Theme.gray600).lineSpacing(2)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.info.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }

    private func iconFor(_ type: KYCType) -> String {
        switch type {
        case .ghanaCard: return "person.text.rectangle.fill"
        case .passport: return "book.closed.fill"
        case .driversLicense: return "car.fill"
        case .selfie: return "face.smiling.fill"
        }
    }
}
