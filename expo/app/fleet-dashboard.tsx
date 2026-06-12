import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Car, DollarSign, TrendingUp, Wrench, CalendarCheck, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockFleetVehicles, mockEarnings } from '@/mocks/cars';

const VEHICLE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Available' },
  rented: { bg: Colors.info + '20', text: Colors.info, label: 'Rented' },
  maintenance: { bg: Colors.warning + '20', text: Colors.warning, label: 'Maintenance' },
  inactive: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Inactive' },
};

export default function FleetDashboardScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Total Revenue</Text>
          <Text style={styles.earningsValue}>GH₵{mockEarnings.totalRevenue.toLocaleString()}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <TrendingUp size={14} color={Colors.success} />
              <Text style={styles.earningLabel}>This Month</Text>
              <Text style={styles.earningAmount}>GH₵{mockEarnings.thisMonth.toLocaleString()}</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningItem}>
              <DollarSign size={14} color={Colors.warning} />
              <Text style={styles.earningLabel}>Pending</Text>
              <Text style={styles.earningAmount}>GH₵{mockEarnings.pendingPayouts.toLocaleString()}</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningItem}>
              <TrendingUp size={14} color={Colors.info} />
              <Text style={styles.earningLabel}>Last Month</Text>
              <Text style={styles.earningAmount}>GH₵{mockEarnings.lastMonth.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <CalendarCheck size={20} color={Colors.info} />
            <Text style={styles.statValue}>{mockEarnings.completedTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Car size={20} color={Colors.success} />
            <Text style={styles.statValue}>{mockEarnings.activeRentals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Wrench size={20} color={Colors.warning} />
            <Text style={styles.statValue}>{mockFleetVehicles.filter(v => v.status === 'maintenance').length}</Text>
            <Text style={styles.statLabel}>Service</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>My Fleet</Text>

        {mockFleetVehicles.map((vehicle) => {
          const statusConfig = VEHICLE_STATUS_CONFIG[vehicle.status] ?? VEHICLE_STATUS_CONFIG.active;
          return (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <Image source={{ uri: vehicle.car.image }} style={styles.vehicleImage} contentFit="cover" />
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleNameWrap}>
                    <Text style={styles.vehicleBrand}>{vehicle.car.brand}</Text>
                    <Text style={styles.vehicleModel} numberOfLines={1}>{vehicle.car.model}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                  </View>
                </View>
                <View style={styles.vehicleStats}>
                  <Text style={styles.vehicleStat}>{vehicle.totalTrips} trips</Text>
                  <Text style={styles.vehicleDot}>·</Text>
                  <Text style={styles.vehicleStat}>GH₵{vehicle.totalEarnings.toLocaleString()}</Text>
                </View>
                {vehicle.status === 'maintenance' && (
                  <View style={styles.maintenanceAlert}>
                    <AlertTriangle size={12} color={Colors.warning} />
                    <Text style={styles.maintenanceText}>Due: {vehicle.nextMaintenance}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  earningsCard: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500' as const,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 4,
  },
  earningsRow: {
    flexDirection: 'row' as const,
    marginTop: 18,
    gap: 16,
  },
  earningItem: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  earningDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  earningLabel: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  earningAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  vehicleCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  vehicleImage: {
    width: 110,
    height: 110,
  },
  vehicleInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center' as const,
  },
  vehicleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  vehicleNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  vehicleBrand: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  vehicleStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 8,
  },
  vehicleStat: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  vehicleDot: {
    color: Colors.gray[400],
  },
  maintenanceAlert: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 6,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  maintenanceText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
});
