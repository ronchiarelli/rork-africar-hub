// Hand-written to mirror supabase/migrations/20260706120000_init_schema.sql.
// Once a real Supabase project is linked, replace this with the generated
// version: `npx supabase gen types typescript --linked > types/database.ts`.

export type UserRoleDb = 'customer' | 'fleet_owner' | 'dealership' | 'admin';
export type VerificationStatusDb = 'none' | 'pending' | 'restricted' | 'approved' | 'rejected';
export type MomoProviderDb = 'mtn' | 'vodafone' | 'airteltigo';
export type BookingStatusDb = 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
export type FleetStatusDb = 'active' | 'maintenance' | 'rented' | 'inactive';
export type SubscriptionStatusDb = 'trialing' | 'active' | 'past_due' | 'cancelled';
export type SubscriptionPaymentStatusDb = 'pending' | 'completed' | 'failed';
export type KycDocTypeDb = 'ghana_card' | 'passport' | 'drivers_license' | 'selfie';
export type KycStatusDb = 'not_uploaded' | 'uploaded' | 'verified' | 'rejected';
export type LeadStatusDb = 'new' | 'contacted' | 'converted' | 'lost';
export type ListingTypeDb = 'sale' | 'featured';
export type ListingStatusDb = 'active' | 'sold' | 'draft';
export type TransmissionDb = 'Automatic' | 'Manual';
export type FuelTypeDb = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
export type SaleConditionDb = 'New' | 'Foreign Used' | 'Locally Used';
export type NotificationTypeDb = 'booking' | 'payment' | 'promo' | 'kyc' | 'system';
export type WalletTxTypeDb = 'credit' | 'debit';
export type WalletTxStatusDb = 'completed' | 'pending' | 'failed';
export type RoleAppStatusDb = 'pending' | 'approved' | 'rejected';

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  avatar: string | null;
  role: UserRoleDb;
  is_verified: boolean;
  verification_status: VerificationStatusDb;
  is_suspended: boolean;
  accepts_inapp_payment: boolean;
  kyc_exempt: boolean;
  phone_login: string | null;
  momo_provider: MomoProviderDb | null;
  momo_number: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  total_bookings: number;
  member_since: string;
  created_at: string;
  updated_at: string;
}

export type BrandRow = {
  id: string;
  name: string;
  logo: string | null;
  car_count: number;
}

export type ListingApprovalDb = 'pending' | 'approved' | 'rejected';

export type CarRow = {
  id: string;
  owner_id: string | null;
  brand: string;
  model: string;
  year: number;
  category: string;
  image: string;
  images: string[];
  price_per_day: number;
  price_per_week: number;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  seats: number;
  transmission: TransmissionDb;
  fuel_type: FuelTypeDb;
  horsepower: number;
  has_ac: boolean;
  rating: number;
  review_count: number;
  is_available: boolean;
  description: string | null;
  features: string[];
  owner_name: string | null;
  owner_phone: string | null;
  views: number;
  is_featured: boolean;
  is_home_featured: boolean;
  approval_status: ListingApprovalDb;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type SaleCarRow = {
  id: string;
  dealer_id: string | null;
  brand: string;
  model: string;
  year: number;
  category: string;
  image: string;
  images: string[];
  sale_price: number;
  mileage: number;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  fuel_type: FuelTypeDb;
  transmission: TransmissionDb;
  condition: SaleConditionDb;
  dealer_name: string | null;
  dealer_phone: string | null;
  dealer_avatar: string | null;
  is_featured: boolean;
  is_home_featured: boolean;
  views: number;
  description: string | null;
  features: string[];
  approval_status: ListingApprovalDb;
  rejection_reason: string | null;
  created_at: string;
}

export type DealerListingRow = {
  id: string;
  dealer_id: string | null;
  sale_car_id: string;
  listing_type: ListingTypeDb;
  asking_price: number;
  views: number;
  leads: number;
  status: ListingStatusDb;
  created_at: string;
}

export type LeadRow = {
  id: string;
  dealer_listing_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  car_model: string | null;
  message: string | null;
  status: LeadStatusDb;
  created_at: string;
}

export type ConversationRow = {
  id: string;
  customer_id: string;
  counterpart_id: string;
  context_type: string | null;
  context_id: string | null;
  context_label: string | null;
  last_message_at: string | null;
  created_at: string;
}

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export type BookingPaymentStatusDb = 'unpaid' | 'paid';

export type BookingRow = {
  id: string;
  car_id: string;
  customer_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  total_days: number;
  subtotal: number;
  service_fee: number;
  insurance_fee: number;
  total_price: number;
  status: BookingStatusDb;
  payment_status: BookingPaymentStatusDb;
  created_at: string;
  updated_at: string;
}

export type SubscriptionRow = {
  id: string;
  user_id: string;
  status: SubscriptionStatusDb;
  amount: number;
  currency: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  hubtel_reference: string | null;
  created_at: string;
  updated_at: string;
}

export type PlatformSettingsRow = {
  id: boolean;
  subscription_monthly_rate: number;
  updated_at: string;
}

export type SubscriptionPaymentRow = {
  id: string;
  subscription_id: string;
  amount: number;
  status: SubscriptionPaymentStatusDb;
  hubtel_reference: string | null;
  hubtel_transaction_id: string | null;
  period_start: string;
  period_end: string | null;
  created_at: string;
}

export type FleetVehicleRow = {
  id: string;
  car_id: string;
  owner_id: string;
  status: FleetStatusDb;
  total_earnings: number;
  total_trips: number;
  next_maintenance: string | null;
  created_at: string;
}

export type KycDocSideDb = 'single' | 'front' | 'back';

export type KycDocumentRow = {
  id: string;
  user_id: string;
  type: KycDocTypeDb;
  side: KycDocSideDb;
  label: string | null;
  status: KycStatusDb;
  storage_path: string | null;
  uploaded_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export type WalletRow = {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export type WalletTransactionRow = {
  id: string;
  wallet_id: string;
  type: WalletTxTypeDb;
  amount: number;
  description: string | null;
  status: WalletTxStatusDb;
  related_booking_id: string | null;
  hubtel_reference: string | null;
  created_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationTypeDb;
  title: string;
  message: string;
  is_read: boolean;
  action_route: string | null;
  action_params: Record<string, string> | null;
  created_at: string;
}

export type ReviewRow = {
  id: string;
  booking_id: string;
  car_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  created_at: string;
}

export type IssueReportStatusDb = 'open' | 'in_review' | 'resolved';

export type IssueReportRow = {
  id: string;
  booking_id: string;
  car_id: string;
  customer_id: string;
  category: string;
  description: string;
  photo_url: string | null;
  status: IssueReportStatusDb;
  created_at: string;
}

export type FavoriteRow = {
  user_id: string;
  car_id: string;
  created_at: string;
}

export type RoleApplicationRow = {
  id: string;
  user_id: string;
  requested_role: UserRoleDb;
  status: RoleAppStatusDb;
  note: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export type BannerCtaTypeDb = 'route' | 'url' | 'phone';
export type BannerLayoutDb = 'template' | 'full_image';

export type PromoBannerRow = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_route: string;
  cta_type: BannerCtaTypeDb;
  layout: BannerLayoutDb;
  focal_x: number;
  focal_y: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type PushTokenRow = {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, Partial<ProfileRow> & { id: string }>;
      brands: TableDef<BrandRow>;
      cars: TableDef<CarRow>;
      sale_cars: TableDef<SaleCarRow>;
      dealer_listings: TableDef<DealerListingRow>;
      leads: TableDef<LeadRow>;
      bookings: TableDef<BookingRow>;
      fleet_vehicles: TableDef<FleetVehicleRow>;
      kyc_documents: TableDef<KycDocumentRow>;
      wallets: TableDef<WalletRow>;
      wallet_transactions: TableDef<WalletTransactionRow>;
      notifications: TableDef<NotificationRow>;
      reviews: TableDef<ReviewRow>;
      issue_reports: TableDef<IssueReportRow>;
      favorites: TableDef<FavoriteRow>;
      role_applications: TableDef<RoleApplicationRow, Partial<RoleApplicationRow> & { user_id: string; requested_role: UserRoleDb }>;
      subscriptions: TableDef<SubscriptionRow>;
      subscription_payments: TableDef<SubscriptionPaymentRow>;
      platform_settings: TableDef<PlatformSettingsRow>;
      promo_banners: TableDef<PromoBannerRow, Partial<PromoBannerRow>>;
      push_tokens: TableDef<PushTokenRow, Partial<PushTokenRow> & { user_id: string; token: string }>;
      conversations: TableDef<ConversationRow>;
      chat_messages: TableDef<ChatMessageRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_booking: {
        Args: { p_car_id: string; p_pickup_date: string; p_return_date: string; p_pickup_location: string };
        Returns: BookingRow;
      };
      cars_booked_today: {
        Args: Record<string, never>;
        Returns: { cars_booked_today: string }[];
      };
      delete_car: {
        Args: { p_car_id: string };
        Returns: void;
      };
      fleet_owner_review_booking: {
        Args: { p_booking_id: string; p_decision: 'approved' | 'cancelled' };
        Returns: BookingRow;
      };
      admin_review_kyc: {
        Args: { p_doc_id: string; p_decision: 'verified' | 'rejected'; p_rejection_reason?: string | null };
        Returns: void;
      };
      admin_approve_role: {
        Args: { p_user_id: string; p_decision: 'approved' | 'rejected' };
        Returns: void;
      };
      admin_platform_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          total_bookings: number;
          total_subscription_revenue: number;
          total_cars: number;
          total_sale_cars: number;
          pending_kyc: number;
          new_users_this_month: number;
          new_users_last_month: number;
        }[];
      };
      admin_set_suspended: {
        Args: { p_user_id: string; p_suspended: boolean };
        Returns: void;
      };
      admin_set_inapp_payment_enabled: {
        Args: { p_user_id: string; p_enabled: boolean };
        Returns: void;
      };
      admin_set_car_featured: {
        Args: { p_car_id: string; p_featured: boolean };
        Returns: void;
      };
      admin_set_car_home_featured: {
        Args: { p_car_id: string; p_featured: boolean };
        Returns: void;
      };
      admin_set_sale_car_featured: {
        Args: { p_sale_car_id: string; p_featured: boolean };
        Returns: void;
      };
      admin_set_sale_car_home_featured: {
        Args: { p_sale_car_id: string; p_featured: boolean };
        Returns: void;
      };
      owner_accepts_inapp_payment: {
        Args: { p_owner_id: string };
        Returns: boolean;
      };
      admin_set_kyc_exempt: {
        Args: { p_user_id: string; p_exempt: boolean };
        Returns: void;
      };
      admin_review_listing: {
        Args: { p_target_type: string; p_target_id: string; p_decision: string; p_reason?: string | null };
        Returns: void;
      };
      kyc_cleared: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      owner_payment_details: {
        Args: { p_owner_id: string };
        Returns: {
          momo_provider: MomoProviderDb | null;
          momo_number: string | null;
          bank_name: string | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
        }[];
      };
      admin_revoke_role: {
        Args: { p_user_id: string };
        Returns: void;
      };
      admin_extend_subscription: {
        Args: { p_user_id: string; p_days: number };
        Returns: void;
      };
      admin_set_subscription_rate: {
        Args: { p_rate: number };
        Returns: void;
      };
      get_or_create_conversation: {
        Args: { p_other_user_id: string; p_context_type?: string | null; p_context_id?: string | null; p_context_label?: string | null };
        Returns: ConversationRow;
      };
      start_support_conversation: {
        Args: Record<string, never>;
        Returns: ConversationRow;
      };
      send_message: {
        Args: { p_conversation_id: string; p_body: string };
        Returns: ChatMessageRow;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: void;
      };
      admin_set_subscription_status: {
        Args: { p_user_id: string; p_status: SubscriptionStatusDb };
        Returns: void;
      };
      admin_monthly_trends: {
        Args: Record<string, never>;
        Returns: {
          month_start: string;
          new_users: number;
          bookings: number;
          revenue: number;
        }[];
      };
      admin_top_cars: {
        Args: Record<string, never>;
        Returns: {
          car_id: string;
          brand: string;
          model: string;
          image: string;
          booking_count: number;
        }[];
      };
      increment_car_views: {
        Args: { p_car_id: string };
        Returns: void;
      };
      fleet_owner_monthly_trends: {
        Args: Record<string, never>;
        Returns: {
          month_start: string;
          bookings: number;
          revenue: number;
        }[];
      };
      fleet_owner_top_cars: {
        Args: Record<string, never>;
        Returns: {
          car_id: string;
          brand: string;
          model: string;
          image: string;
          views: number;
          booking_count: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
