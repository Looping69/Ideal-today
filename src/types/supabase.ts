export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          booking_confirmation_template: string | null
          enable_2fa: boolean | null
          id: number
          maintenance_mode: boolean | null
          meta_description: string | null
          require_email_verification: boolean | null
          service_fee_percent: number | null
          site_name: string | null
          support_email: string | null
          updated_at: string | null
          welcome_email_template: string | null
        }
        Insert: {
          booking_confirmation_template?: string | null
          enable_2fa?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          meta_description?: string | null
          require_email_verification?: boolean | null
          service_fee_percent?: number | null
          site_name?: string | null
          support_email?: string | null
          updated_at?: string | null
          welcome_email_template?: string | null
        }
        Update: {
          booking_confirmation_template?: string | null
          enable_2fa?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          meta_description?: string | null
          require_email_verification?: boolean | null
          service_fee_percent?: number | null
          site_name?: string | null
          support_email?: string | null
          updated_at?: string | null
          welcome_email_template?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          confirmed_at: string | null
          created_at: string | null
          id: string
          payment_status: string
          property_id: string | null
          status: string | null
          total_price: number
          user_id: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string
          property_id?: string | null
          status?: string | null
          total_price: number
          user_id?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string
          property_id?: string | null
          status?: string | null
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          is_province: boolean | null
          label: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon: string
          id: string
          is_province?: boolean | null
          label: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          is_province?: boolean | null
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      content_generations: {
        Row: {
          action: string
          created_at: string
          id: string
          request_payload: Json
          response_payload: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          request_payload: Json
          response_payload: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          request_payload?: Json
          response_payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      guest_notes: {
        Row: {
          content: string
          created_at: string
          guest_id: string
          host_id: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          guest_id: string
          host_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          guest_id?: string
          host_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_notes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_notes_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string | null
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          commission_model: string | null
          created_at: string
          partner_code: string | null
          payout_details: Json
          profile_id: string
          region_focus: string | null
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          commission_model?: string | null
          created_at?: string
          partner_code?: string | null
          payout_details?: Json
          profile_id: string
          region_focus?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          commission_model?: string | null
          created_at?: string
          partner_code?: string | null
          payout_details?: Json
          profile_id?: string
          region_focus?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          kind: string
          provider_payment_id: string | null
          provider_response: Json | null
          status: string
          target_booking_id: string | null
          target_plan: string | null
          target_plan_interval: string | null
          user_id: string
          yoco_checkout_id: string | null
          yoco_event_id: string | null
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind: string
          provider_payment_id?: string | null
          provider_response?: Json | null
          status?: string
          target_booking_id?: string | null
          target_plan?: string | null
          target_plan_interval?: string | null
          user_id: string
          yoco_checkout_id?: string | null
          yoco_event_id?: string | null
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          provider_payment_id?: string | null
          provider_response?: Json | null
          status?: string
          target_booking_id?: string | null
          target_plan?: string | null
          target_plan_interval?: string | null
          user_id?: string
          yoco_checkout_id?: string | null
          yoco_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_target_booking_id_fkey"
            columns: ["target_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: Json | null
          balance: number | null
          bio: string | null
          business_address: string | null
          created_at: string
          deactivated: boolean | null
          email: string | null
          full_name: string | null
          host_plan: string | null
          host_plan_expires_at: string | null
          host_plan_interval: string | null
          host_plan_started_at: string | null
          host_referral_code: string | null
          id: string
          is_admin: boolean
          is_founding_member: boolean | null
          level: string | null
          phone: string | null
          points: number | null
          preferences: Json | null
          referral_code: string | null
          referral_tier: Database["public"]["Enums"]["referral_tier"] | null
          referred_by: string | null
          referred_by_host: string | null
          updated_at: string | null
          verification_docs: Json | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: Json | null
          balance?: number | null
          bio?: string | null
          business_address?: string | null
          created_at?: string
          deactivated?: boolean | null
          email?: string | null
          full_name?: string | null
          host_plan?: string | null
          host_plan_expires_at?: string | null
          host_plan_interval?: string | null
          host_plan_started_at?: string | null
          host_referral_code?: string | null
          id: string
          is_admin?: boolean
          is_founding_member?: boolean | null
          level?: string | null
          phone?: string | null
          points?: number | null
          preferences?: Json | null
          referral_code?: string | null
          referral_tier?: Database["public"]["Enums"]["referral_tier"] | null
          referred_by?: string | null
          referred_by_host?: string | null
          updated_at?: string | null
          verification_docs?: Json | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: Json | null
          balance?: number | null
          bio?: string | null
          business_address?: string | null
          created_at?: string
          deactivated?: boolean | null
          email?: string | null
          full_name?: string | null
          host_plan?: string | null
          host_plan_expires_at?: string | null
          host_plan_interval?: string | null
          host_plan_started_at?: string | null
          host_referral_code?: string | null
          id?: string
          is_admin?: boolean
          is_founding_member?: boolean | null
          level?: string | null
          phone?: string | null
          points?: number | null
          preferences?: Json | null
          referral_code?: string | null
          referral_tier?: Database["public"]["Enums"]["referral_tier"] | null
          referred_by?: string | null
          referred_by_host?: string | null
          updated_at?: string | null
          verification_docs?: Json | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_host_fkey"
            columns: ["referred_by_host"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          adults: number | null
          amenities: string[] | null
          approval_status: string | null
          area: string | null
          bathrooms: number
          bedrooms: number
          categories: string[] | null
          children: number | null
          cleaning_fee: number | null
          created_at: string | null
          description: string | null
          discount: number | null
          facilities: string[] | null
          guests: number
          has_restaurant: boolean | null
          host_avatar: string | null
          host_id: string | null
          host_joined: string | null
          host_name: string | null
          id: string
          image: string | null
          images: string[] | null
          is_featured: boolean | null
          is_occupied: boolean | null
          is_self_catering: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          other_facility: string | null
          price: number
          province: string | null
          rating: number | null
          rejection_reason: string | null
          restaurant_offers: string[] | null
          reviews_count: number | null
          service_fee: number | null
          title: string
          type: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          adults?: number | null
          amenities?: string[] | null
          approval_status?: string | null
          area?: string | null
          bathrooms: number
          bedrooms: number
          categories?: string[] | null
          children?: number | null
          cleaning_fee?: number | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          facilities?: string[] | null
          guests: number
          has_restaurant?: boolean | null
          host_avatar?: string | null
          host_id?: string | null
          host_joined?: string | null
          host_name?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_occupied?: boolean | null
          is_self_catering?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          other_facility?: string | null
          price: number
          province?: string | null
          rating?: number | null
          rejection_reason?: string | null
          restaurant_offers?: string[] | null
          reviews_count?: number | null
          service_fee?: number | null
          title: string
          type: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          adults?: number | null
          amenities?: string[] | null
          approval_status?: string | null
          area?: string | null
          bathrooms?: number
          bedrooms?: number
          categories?: string[] | null
          children?: number | null
          cleaning_fee?: number | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          facilities?: string[] | null
          guests?: number
          has_restaurant?: boolean | null
          host_avatar?: string | null
          host_id?: string | null
          host_joined?: string | null
          host_name?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_occupied?: boolean | null
          is_self_catering?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          other_facility?: string | null
          price?: number
          province?: string | null
          rating?: number | null
          rejection_reason?: string | null
          restaurant_offers?: string[] | null
          reviews_count?: number | null
          service_fee?: number | null
          title?: string
          type?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_attributions: {
        Row: {
          captured_at: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          partner_profile_id: string | null
          referrer_profile_id: string | null
          source_key: string
          source_label: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          partner_profile_id?: string | null
          referrer_profile_id?: string | null
          source_key: string
          source_label?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          partner_profile_id?: string | null
          referrer_profile_id?: string | null
          source_key?: string
          source_label?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_referrer_profile_id_fkey"
            columns: ["referrer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          percentage: number
          referee_host_id: string | null
          referrer_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          percentage: number
          referee_host_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          percentage?: number
          referee_host_id?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referee_host_id_fkey"
            columns: ["referee_host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number | null
          approved_at: string | null
          attribution_id: string | null
          beneficiary_profile_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          reward_key: string | null
          reward_stage: string
          reward_type: string
          status: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          attribution_id?: string | null
          beneficiary_profile_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          reward_key?: string | null
          reward_stage: string
          reward_type: string
          status?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          attribution_id?: string | null
          beneficiary_profile_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          reward_key?: string | null
          reward_stage?: string
          reward_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "referral_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_beneficiary_profile_id_fkey"
            columns: ["beneficiary_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string | null
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          content: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          property_id: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          property_id?: string | null
          rating: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          property_id?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_completions: {
        Row: {
          created_at: string
          id: string | null
          reward_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string | null
          reward_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string | null
          reward_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visibility_credits: {
        Row: {
          consumed_at: string | null
          created_at: string
          credit_type: string
          expires_at: string | null
          id: string
          metadata: Json
          profile_id: string
          quantity: number
          reward_key: string | null
          source: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          credit_type: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          profile_id: string
          quantity?: number
          reward_key?: string | null
          source: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          credit_type?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          profile_id?: string
          quantity?: number
          reward_key?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "visibility_credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_coastal_explorer: { Args: never; Returns: string }
      claim_photo_finisher: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      update_property_reviews: {
        Args: { p_property_id: string }
        Returns: undefined
      }
    }
    Enums: {
      referral_tier: "founder" | "pro" | "standard"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      referral_tier: ["founder", "pro", "standard"],
    },
  },
} as const
