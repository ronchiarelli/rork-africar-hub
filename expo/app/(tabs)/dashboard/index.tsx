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
  ShieldCheck,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useFavoriteIds } from "@/lib/queries/favorites";
import { useWallet } from "@/lib/queries/wallet";
import AdminDashboardScreen from "@/app/admin-dashboard";
import FleetDashboardScreen from "@/app/fleet-dashboard";
import DealerDashboardScreen from "@/app/dealer-dashboard";

// ─── Customer Dashboard ────────────────────────────────────────────────────

function CustomerDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { data: favoriteIds = [] } = useFavoriteIds(currentUser?.id);
  const { data: wallet } = useWallet();

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
          <Text style={sd.statValue}>{favoriteIds.length}</Text>
          <Text style={sd.statLabel}>Favorites</Text>
        </View>
        <View style={sd.statCard}>
          <Wallet size={20} color={Colors.orange.primary} />
          <Text style={sd.statValue}>GH₵{(wallet?.balance ?? 0).toLocaleString()}</Text>
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
      {currentRole === "fleet_owner" && <FleetDashboardScreen />}
      {currentRole === "dealership" && <DealerDashboardScreen />}
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
