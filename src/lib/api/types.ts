export type ApiActionRequest<TAction extends string, TPayload> = {
  action: TAction;
  payload: TPayload;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiFailure = {
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type HostPlan = "free" | "standard" | "premium";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "canceled"
  | "blocked";

export interface HostProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: Record<string, unknown> | null;
  business_address?: string | null;
  host_plan: HostPlan;
  verification_status: VerificationStatus;
  verification_submitted_at?: string | null;
  verification_docs?: Record<string, string> | null;
  points?: number | null;
  level?: string | null;
  badges?: RewardBadge[] | null;
  referral_code?: string | null;
  host_referral_code?: string | null;
  is_admin?: boolean | null;
  deactivated?: boolean | null;
}

export interface PropertyRecord {
  id: string;
  title: string;
  location: string;
  province?: string | null;
  price: number;
  rating?: number | null;
  reviews_count?: number | null;
  image?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  type: string;
  amenities?: string[] | null;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  description?: string | null;
  host_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cleaning_fee?: number | null;
  service_fee?: number | null;
  categories?: string[] | null;
  is_featured?: boolean | null;
  approval_status?: "pending" | "approved" | "rejected" | null;
  rejection_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  host?: {
    full_name?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
    host_plan?: HostPlan | null;
  } | null;
}

export interface AvailabilityEntry {
  property_id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
}

export interface BookingRecord {
  id: string;
  property_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: BookingStatus;
  created_at?: string | null;
  property?: {
    id?: string;
    title?: string;
    image?: string | null;
    location?: string | null;
  } | null;
  user?: {
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
}

export interface MessageRecord {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

export interface PaymentSessionStatus {
  id: string;
  kind: "booking" | "host_plan";
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";
  booking_id?: string | null;
  plan_id?: HostPlan | null;
  provider_checkout_id?: string | null;
  redirect_url?: string | null;
  confirmed_at?: string | null;
  booking?: BookingRecord | null;
}

export interface RewardBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  date: string;
}

export interface RewardsDashboardData {
  points: number;
  level: string;
  badges: RewardBadge[];
  referral_code?: string | null;
  referrals: Array<{
    referee_id: string;
    status: string;
    created_at: string;
    rewarded_at?: string | null;
  }>;
}

export interface VerificationDocumentAsset {
  path: string;
  url: string;
}

export interface AdminSettingsRecord {
  id: number;
  site_name?: string | null;
  support_email?: string | null;
  meta_description?: string | null;
  require_email_verification?: boolean | null;
  enable_2fa?: boolean | null;
  maintenance_mode?: boolean | null;
  service_fee_percent?: number | null;
  welcome_email_template?: string | null;
  booking_confirmation_template?: string | null;
}

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: "pending" | "confirmed" | "rewarded";
  created_at: string;
  rewarded_at?: string | null;
  referrer?: {
    email?: string | null;
    full_name?: string | null;
  } | null;
  referee?: {
    email?: string | null;
    full_name?: string | null;
  } | null;
}

export interface RewardCompletionRecord {
  id: string;
  user_id: string;
  reward_code: string;
  created_at: string;
  user?: {
    email?: string | null;
    full_name?: string | null;
  } | null;
}
