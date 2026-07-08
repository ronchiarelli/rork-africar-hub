import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Car,
  CalendarCheck,
  Heart,
  Wallet,
  ChevronRight,
  Wrench,
  AlertTriangle,
  Eye,
  PhoneCall,
  ShieldCheck,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useMyFleetVehicles } from "@/lib/queries/fleet";
import { useMyDealerListings, useMyLeads } from "@/lib/queries/dealer";
import AdminDashboardScreen from "@/app/admin-dashboard";

// ─── Fleet Owner Dashboard ────────────────────────────────────────────────

function FleetDashboard() {
  const { data: fleetVehicles = [] } = useMyFleetVehicles();
  const earnings = {
    totalRevenue: fleetVehicles.reduce((s, v) => s + v.totalEarnings, 0),
    completedTrips: fleetVehicles.reduce((s, v) => s + v.totalTrips, 0),
    activeRentals: fleetVehicles.filter((v) => v.status === "rented").length,
  };
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: Colors.success + "20", text: Colors.success, label: "Available" },
    rented: { bg: Colors.info + "20", text: Colors.info, label: "Rented" },
    maintenance: { bg: Colors.warning + "20", text: Colors.warning, label: "Maintenance" },
    inactive: { bg: Colors.gray[200], text: Colors.gray[600], label: "Inactive" },
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sd.content}>
      <View style={sd.earningsCard}>
        <Text style={sd.earningsTitle}>Total Revenue</Text>
        <Text style={sd.earningsValue}>GH₵{earnings.totalRevenue.toLocaleString()}</Text>
      </View>

      <View style={sd.statsRow}>
        <View style={sd.statCard}>
          <CalendarCheck size={20} color={Colors.info} />
          <Text style={sd.statValue}>{earnings.completedTrips}</Text>
          <Text style={sd.statLabel}>Trips</Text>
        </View>
        <View style={sd.statCard}>
          <Car size={20} color={Colors.success} />
          <Text style={sd.statValue}>{earnings.activeRentals}</Text>
          <Text style={sd.statLabel}>Active</Text>
        </View>
        <View style={sd.statCard}>
          <Wrench size={20} color={Colors.warning} />
          <Text style={sd.statValue}>{fleetVehicles.filter(v => v.status === "maintenance").length}</Text>
          <Text style={sd.statLabel}>Service</Text>
        </View>
      </View>

      <Text style={sd.sectionTitle}>My Fleet</Text>

      {fleetVehicles.map((vehicle) => {
        const cfg = statusConfig[vehicle.status] ?? statusConfig.active;
        return (
          <View key={vehicle.id} style={sd.vehicleCard}>
            <Image source={{ uri: vehicle.car.image }} style={sd.vehicleImage} contentFit="cover" />
            <View style={sd.vehicleInfo}>
              <View style={sd.vehicleHeader}>
                <View style={sd.vehicleNameWrap}>
                  <Text style={sd.vehicleBrand}>{vehicle.car.brand}</Text>
                  <Text style={sd.vehicleModel} numberOfLines={1}>{vehicle.car.model}</Text>
                </View>
                <View style={[sd.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[sd.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={sd.vehicleMeta}>
                <Text style={sd.vehicleMetaText}>GH₵{vehicle.totalEarnings.toLocaleString()} earned</Text>
                <Text style={sd.vehicleMetaDot}>·</Text>
                <Text style={sd.vehicleMetaText}>{vehicle.totalTrips} trips</Text>
              </View>
              {vehicle.status === "maintenance" && (
                <View style={sd.maintenanceAlert}>
                  <AlertTriangle size={12} color={Colors.warning} />
                  <Text style={sd.maintenanceText}>Next service: {vehicle.nextMaintenance}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Dealer Dashboard ──────────────────────────────────────────────────────

function DealerDashboard() {
  const { data: listings = [] } = useMyDealerListings();
  const { data: leads = [] } = useMyLeads();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sd.content}>
      <View style={sd.statsRow}>
        <View style={sd.statCard}>
          <Eye size={20} color={Colors.info} />
          <Text style={sd.statValue}>{listings.reduce((s, l) => s + l.views, 0)}</Text>
          <Text style={sd.statLabel}>Views</Text>
        </View>
        <View style={sd.statCard}>
          <PhoneCall size={20} color={Colors.success} />
          <Text style={sd.statValue}>{leads.length}</Text>
          <Text style={sd.statLabel}>Leads</Text>
        </View>
        <View style={sd.statCard}>
          <Car size={20} color={Colors.orange.primary} />
          <Text style={sd.statValue}>{listings.filter(l => l.status === "active").length}</Text>
          <Text style={sd.statLabel}>Active</Text>
        </View>
      </View>

      <Text style={sd.sectionTitle}>My Listings</Text>

      {listings.map((listing) => {
        const statusCfg: Record<string, { bg: string; text: string }> = {
          active: { bg: Colors.success + "20", text: Colors.success },
          sold: { bg: Colors.gray[200], text: Colors.gray[600] },
          draft: { bg: Colors.warning + "20", text: Colors.warning },
        };
        const cfg = statusCfg[listing.status] ?? statusCfg.active;
        return (
          <View key={listing.id} style={sd.vehicleCard}>
            <Image source={{ uri: listing.car.image }} style={sd.vehicleImage} contentFit="cover" />
            <View style={sd.vehicleInfo}>
              <View style={sd.vehicleHeader}>
                <View style={sd.vehicleNameWrap}>
                  <Text style={sd.vehicleBrand}>{listing.car.brand}</Text>
                  <Text style={sd.vehicleModel} numberOfLines={1}>{listing.car.model}</Text>
                </View>
                <View style={[sd.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[sd.statusText, { color: cfg.text }]}>{listing.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={sd.vehicleMeta}>
                <Text style={sd.vehicleMetaText}>GH₵{listing.askingPrice.toLocaleString()}</Text>
                <Text style={sd.vehicleMetaDot}>·</Text>
                <Text style={sd.vehicleMetaText}>{listing.views} views</Text>
                <Text style={sd.vehicleMetaDot}>·</Text>
                <Text style={sd.vehicleMetaText}>{listing.leads} leads</Text>
              </View>
              {listing.listingType === "featured" && (
                <View style={sd.featuredTag}>
                  <Text style={sd.featuredTagText}>Featured</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <Text style={[sd.sectionTitle, { marginTop: 20 }]}>Recent Leads</Text>

      {leads.slice(0, 5).map((lead) => (
        <View key={lead.id} style={sd.leadCard}>
          <View style={sd.leadInfo}>
            <Text style={sd.leadName}>{lead.customerName}</Text>
            <Text style={sd.leadCar}>{lead.carModel}</Text>
            <Text style={sd.leadMessage} numberOfLines={1}>{lead.message}</Text>
          </View>
          <View style={[sd.leadStatus, { backgroundColor: lead.status === "new" ? Colors.orange.faint : Colors.gray[100] }]}>
            <Text style={[sd.leadStatusText, { color: lead.status === "new" ? Colors.orange.primary : Colors.gray[600] }]}>
              {lead.status}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}


// ─── Customer Dashboard ────────────────────────────────────────────────────

function CustomerDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sd.content}>
      <View style={csd.welcomeCard}>
        <Image source={{ uri: currentUser?.avatar ?? "" }} style={csd.avatar} contentFit="cover" />
        <View style={csd.welcomeInfo}>
          <Text style={csd.welcomeGreeting}>Welcome back,</Text>
          <Text style={csd.welcomeName}>{currentUser?.name?.split(" ")[0] ?? "Guest"}</Text>
        </View>
        {currentUser?.verificationStatus === "approved" && (
          <View style={csd.verifiedBadge}>
            <ShieldCheck size={12} color={Colors.success} />
            <Text style={csd.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={sd.statsRow}>
        <View style={sd.statCard}>
          <CalendarCheck size={20} color={Colors.info} />
          <Text style={sd.statValue}>{currentUser?.totalBookings ?? 0}</Text>
          <Text style={sd.statLabel}>Bookings</Text>
        </View>
        <View style={sd.statCard}>
          <Heart size={20} color={Colors.error} />
          <Text style={sd.statValue}>3</Text>
          <Text style={sd.statLabel}>Favorites</Text>
        </View>
        <View style={sd.statCard}>
          <Wallet size={20} color={Colors.orange.primary} />
          <Text style={sd.statValue}>GH₵250</Text>
          <Text style={sd.statLabel}>Wallet</Text>
        </View>
      </View>

      <Text style={sd.sectionTitle}>Quick Actions</Text>

      <View style={csd.actionsGrid}>
        <Pressable style={csd.actionCard} onPress={() => router.push("/bookings")}>
          <View style={[csd.actionIcon, { backgroundColor: Colors.info + "15" }]}>
            <CalendarCheck size={22} color={Colors.info} />
          </View>
          <Text style={csd.actionLabel}>My Bookings</Text>
          <ChevronRight size={14} color={Colors.gray[400]} />
        </Pressable>
        <Pressable style={csd.actionCard} onPress={() => router.push("/favorites")}>
          <View style={[csd.actionIcon, { backgroundColor: Colors.error + "15" }]}>
            <Heart size={22} color={Colors.error} />
          </View>
          <Text style={csd.actionLabel}>Favorites</Text>
          <ChevronRight size={14} color={Colors.gray[400]} />
        </Pressable>
        <Pressable style={csd.actionCard} onPress={() => router.push("/marketplace")}>
          <View style={[csd.actionIcon, { backgroundColor: Colors.orange.faint }]}>
            <Car size={22} color={Colors.orange.primary} />
          </View>
          <Text style={csd.actionLabel}>Marketplace</Text>
          <ChevronRight size={14} color={Colors.gray[400]} />
        </Pressable>
        <Pressable style={csd.actionCard} onPress={() => router.push("/wallet")}>
          <View style={[csd.actionIcon, { backgroundColor: Colors.success + "15" }]}>
            <Wallet size={22} color={Colors.success} />
          </View>
          <Text style={csd.actionLabel}>My Wallet</Text>
          <ChevronRight size={14} color={Colors.gray[400]} />
        </Pressable>
      </View>

      <Text style={sd.sectionTitle}>Getting Started</Text>
      <View style={csd.tipCard}>
        <Text style={csd.tipTitle}>New to GoCar Hub?</Text>
        <Text style={csd.tipText}>Browse trending cars on the Home tab, tap the floating search button to find your perfect ride, or explore cars for sale in the Marketplace.</Text>
        <Pressable style={csd.tipBtn} onPress={() => router.push("/(tabs)/(home)")}>
          <Text style={csd.tipBtnText}>Explore Cars</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main Dashboard (role-aware) ───────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { currentRole } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      {currentRole === "fleet_owner" && <FleetDashboard />}
      {currentRole === "dealership" && <DealerDashboard />}
      {currentRole === "admin" && <AdminDashboardScreen />}
      {currentRole === "customer" && <CustomerDashboard />}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.gray[900] },
});

const sd = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  earningsCard: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
  },
  earningsTitle: { color: Colors.gray[400], fontSize: 14 },
  earningsValue: { color: Colors.white, fontSize: 36, fontWeight: "800" as const, marginTop: 4 },
  earningsRow: { flexDirection: "row" as const, marginTop: 14, gap: 0 },
  earningItem: { flex: 1, alignItems: "center" as const, gap: 2 },
  earningLabel: { color: Colors.gray[400], fontSize: 11 },
  earningAmount: { color: Colors.white, fontSize: 14, fontWeight: "700" as const },
  earningDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  statsRow: { flexDirection: "row" as const, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center" as const,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.gray[900] },
  statLabel: { fontSize: 12, color: Colors.gray[500], fontWeight: "500" as const },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.gray[900], marginBottom: 12 },
  vehicleCard: {
    flexDirection: "row" as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleImage: { width: 90, height: 90 },
  vehicleInfo: { flex: 1, padding: 12, justifyContent: "center" as const },
  vehicleHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const },
  vehicleNameWrap: { flex: 1, marginRight: 8 },
  vehicleBrand: { fontSize: 11, color: Colors.gray[500], fontWeight: "500" as const },
  vehicleModel: { fontSize: 15, fontWeight: "700" as const, color: Colors.gray[900] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" as const },
  vehicleMeta: { flexDirection: "row" as const, gap: 4, marginTop: 4 },
  vehicleMetaText: { fontSize: 12, color: Colors.gray[600] },
  vehicleMetaDot: { fontSize: 12, color: Colors.gray[400] },
  maintenanceAlert: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: 6 },
  maintenanceText: { fontSize: 11, color: Colors.warning },
  featuredTag: { marginTop: 4 },
  featuredTagText: { fontSize: 10, fontWeight: "700" as const, color: Colors.orange.primary },
  leadCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 14, fontWeight: "600" as const, color: Colors.gray[900] },
  leadCar: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  leadMessage: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  leadStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  leadStatusText: { fontSize: 11, fontWeight: "600" as const, textTransform: "capitalize" as const },
  statsGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10, marginBottom: 16 },
  statCardWide: {
    width: "47%" as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center" as const,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexGrow: 0,
  },
  growthCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  growthInfo: { flex: 1 },
  growthLabel: { fontSize: 13, color: Colors.gray[500] },
  growthValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.success },
  growthBar: {
    width: 80,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  growthFill: { height: "100%" as const, backgroundColor: Colors.success, borderRadius: 3 },
  userCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600" as const, color: Colors.gray[900] },
  userEmail: { fontSize: 12, color: Colors.gray[500] },
});

const csd = StyleSheet.create({
  welcomeCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.purple.deep,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    marginBottom: 16,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: Colors.white + "40" },
  welcomeInfo: { flex: 1 },
  welcomeGreeting: { color: Colors.gray[400], fontSize: 13 },
  welcomeName: { color: Colors.white, fontSize: 22, fontWeight: "800" as const },
  verifiedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: { color: Colors.success, fontSize: 11, fontWeight: "700" as const },
  actionsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    width: "47%" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: "600" as const, color: Colors.gray[800] },
  tipCard: {
    backgroundColor: Colors.orange.faint,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  tipTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.gray[900] },
  tipText: { fontSize: 13, color: Colors.gray[600], lineHeight: 20 },
  tipBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start" as const,
    marginTop: 8,
  },
  tipBtnText: { color: Colors.white, fontSize: 13, fontWeight: "700" as const },
});
