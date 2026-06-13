import SwiftUI

struct WalletView: View {
    private let wallet = MockData.wallet

    private var totalIn: Int { wallet.transactions.filter { $0.type == .credit }.reduce(0) { $0 + $1.amount } }
    private var totalOut: Int { wallet.transactions.filter { $0.type == .debit }.reduce(0) { $0 + $1.amount } }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                balanceCard
                quickActions
                statsRow
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Transactions").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.gray900)
                    VStack(spacing: 0) {
                        ForEach(Array(wallet.transactions.enumerated()), id: \.element.id) { idx, tx in
                            transactionRow(tx)
                            if idx < wallet.transactions.count - 1 { Divider().padding(.leading, 56) }
                        }
                    }
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
                }
            }
            .padding(20)
        }
        .background(Theme.gray50)
        .navigationTitle("My Wallet")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var balanceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Available Balance").font(.system(size: 14)).foregroundStyle(.white.opacity(0.7))
                Spacer()
                Image(systemName: "wallet.bifold.fill").font(.system(size: 20)).foregroundStyle(Theme.orange)
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(wallet.currency).font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.orange)
                Text(formattedAmount(wallet.balance)).font(.system(size: 40, weight: .heavy)).foregroundStyle(.white)
            }
            Text("AutoRide Wallet").font(.system(size: 13)).foregroundStyle(.white.opacity(0.6))
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Theme.purpleDeep, Theme.purpleMedium], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 22)
        )
    }

    private var quickActions: some View {
        HStack(spacing: 12) {
            actionButton("plus.circle.fill", "Top Up", Theme.orange)
            actionButton("arrow.up.circle.fill", "Withdraw", Theme.info)
            actionButton("arrow.left.arrow.right.circle.fill", "Transfer", Theme.success)
        }
    }

    private func actionButton(_ icon: String, _ label: String, _ color: Color) -> some View {
        Button {} label: {
            VStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 24)).foregroundStyle(color)
                Text(label).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.gray700)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 16)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
        }
        .buttonStyle(PressableStyle())
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard("Total In", totalIn, Theme.success, "arrow.down.left")
            statCard("Total Out", totalOut, Theme.error, "arrow.up.right")
        }
    }

    private func statCard(_ label: String, _ amount: Int, _ color: Color, _ icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color)
                .frame(width: 40, height: 40).background(color.opacity(0.12), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 12)).foregroundStyle(Theme.gray500)
                Text("GH₵ \(formattedAmount(amount))").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.gray900)
            }
            Spacer()
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    private func transactionRow(_ tx: WalletTransaction) -> some View {
        HStack(spacing: 12) {
            Image(systemName: tx.type == .credit ? "arrow.down.left" : "arrow.up.right")
                .font(.system(size: 15)).foregroundStyle(tx.type == .credit ? Theme.success : Theme.error)
                .frame(width: 40, height: 40)
                .background((tx.type == .credit ? Theme.success : Theme.error).opacity(0.12), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.description).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.gray900).lineLimit(1)
                Text(tx.date).font(.system(size: 12)).foregroundStyle(Theme.gray400)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(tx.type == .credit ? "+" : "-") GH₵ \(formattedAmount(tx.amount))")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(tx.type == .credit ? Theme.success : Theme.gray900)
                if tx.status == .pending {
                    Text("Pending").font(.system(size: 10, weight: .semibold)).foregroundStyle(Theme.warning)
                }
            }
        }
        .padding(14)
    }
}
