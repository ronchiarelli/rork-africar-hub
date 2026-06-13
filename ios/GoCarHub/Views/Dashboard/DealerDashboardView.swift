import SwiftUI

struct DealerDashboardView: View {
    private let listings = MockData.dealerListings
    private let leads = MockData.leads

    private var totalViews: Int { listings.reduce(0) { $0 + $1.views } }
    private var totalLeads: Int { listings.reduce(0) { $0 + $1.leads } }
    private var activeCount: Int { listings.filter { $0.status == .active }.count }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                statsRow
                VStack(alignment: .leading, spacing: 12) {
                    Text("My Listings").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(listings) { listing in listingCard(listing) }
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Leads").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(leads) { lead in leadCard(lead) }
                }
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("Dealer Dashboard")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard("\(formattedAmount(totalViews))", "Views", "eye.fill", Theme.info)
            statCard("\(totalLeads)", "Leads", "person.2.fill", Theme.orange)
            statCard("\(activeCount)", "Active", "checkmark.circle.fill", Theme.success)
        }
    }

    private func statCard(_ value: String, _ label: String, _ icon: String, _ color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(color)
                .frame(width: 40, height: 40).background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            Text(value).font(.system(size: 20, weight: .heavy)).foregroundStyle(Theme.gray900)
            Text(label).font(.system(size: 11)).foregroundStyle(Theme.gray500)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func listingCard(_ listing: DealerListing) -> some View {
        HStack(spacing: 12) {
            Color.clear.frame(width: 80, height: 64)
                .overlay { RemoteImage(url: listing.car.image).allowsHitTesting(false) }
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(alignment: .topLeading) {
                    if listing.listingType == .featured {
                        Image(systemName: "sparkles").font(.system(size: 10)).foregroundStyle(.white)
                            .padding(4).background(Theme.orange, in: Circle()).padding(4)
                    }
                }
            VStack(alignment: .leading, spacing: 4) {
                Text(listing.car.model).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.gray900).lineLimit(1)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("GH₵").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.orange)
                    Text(formattedAmount(listing.askingPrice)).font(.system(size: 15, weight: .heavy)).foregroundStyle(Theme.gray900)
                }
                HStack(spacing: 10) {
                    Label("\(listing.views)", systemImage: "eye.fill").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                    Label("\(listing.leads)", systemImage: "person.fill").font(.system(size: 11)).foregroundStyle(Theme.gray500)
                }
            }
            Spacer()
            listingStatusBadge(listing.status)
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func listingStatusBadge(_ status: ListingStatus) -> some View {
        let color: Color = {
            switch status {
            case .active: return Theme.success
            case .sold: return Theme.info
            case .draft: return Theme.gray500
            }
        }()
        return Text(status.rawValue.capitalized).font(.system(size: 11, weight: .bold)).foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(color.opacity(0.12), in: Capsule())
    }

    private func leadCard(_ lead: Lead) -> some View {
        HStack(spacing: 12) {
            Text(String(lead.customerName.prefix(1))).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                .frame(width: 44, height: 44).background(Theme.purpleMedium, in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(lead.customerName).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.gray900)
                    Spacer()
                    leadStatusBadge(lead.status)
                }
                Text(lead.carModel).font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.orange)
                Text(lead.message).font(.system(size: 12)).foregroundStyle(Theme.gray500).lineLimit(2)
            }
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func leadStatusBadge(_ status: LeadStatus) -> some View {
        let color: Color = {
            switch status {
            case .new: return Theme.orange
            case .contacted: return Theme.info
            case .converted: return Theme.success
            case .lost: return Theme.error
            }
        }()
        return Text(status.rawValue.capitalized).font(.system(size: 10, weight: .bold)).foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.12), in: Capsule())
    }
}
