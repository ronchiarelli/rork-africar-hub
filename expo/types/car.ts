export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  image: string;
  images: string[];
  pricePerDay: number;
  pricePerWeek: number;
  location: string;
  seats: number;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  horsepower: number;
  hasAC: boolean;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  description: string;
  features: string[];
  ownerName: string;
  ownerPhone: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  carCount: number;
}

export interface Booking {
  id: string;
  carId: string;
  car: Car;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  totalDays: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export type UserRole = 'customer' | 'fleet_owner' | 'dealership' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isVerified: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isSuspended: boolean;
  totalBookings: number;
  memberSince: string;
  role: UserRole;
}

export interface FleetVehicle {
  id: string;
  carId: string;
  car: Car;
  status: 'active' | 'maintenance' | 'rented' | 'inactive';
  totalEarnings: number;
  totalTrips: number;
  nextMaintenance: string;
}

export interface EarningsSummary {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  completedTrips: number;
  activeRentals: number;
}

export interface DealerListing {
  id: string;
  car: SaleCar;
  listingType: 'sale' | 'featured';
  askingPrice: number;
  views: number;
  leads: number;
  status: 'active' | 'sold' | 'draft';
  createdAt: string;
}

export interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  carModel: string;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending_kyc';
  joinDate: string;
  avatar: string;
}

export interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeListings: number;
  pendingKYC: number;
  monthlyGrowth: number;
}

export interface KYCDocument {
  id: string;
  type: 'ghana_card' | 'passport' | 'drivers_license' | 'selfie';
  label: string;
  status: 'not_uploaded' | 'uploaded' | 'verified' | 'rejected';
  uploadedAt?: string;
  imageUri?: string;
}

export interface SaleCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  image: string;
  images: string[];
  salePrice: number;
  mileage: number;
  location: string;
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  transmission: 'Automatic' | 'Manual';
  condition: 'New' | 'Foreign Used' | 'Locally Used';
  dealerName: string;
  dealerPhone: string;
  dealerAvatar: string;
  isFeatured: boolean;
  views: number;
  description: string;
  features: string[];
}

export interface PaymentMethod {
  id: string;
  type: 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'wallet';
  label: string;
  icon: string;
  details?: string;
}

export interface WalletInfo {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface AppNotification {
  id: string;
  type: 'booking' | 'payment' | 'promo' | 'kyc' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  actionParams?: Record<string, string>;
}
