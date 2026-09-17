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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_plans: {
        Row: {
          calorie_target: number
          created_at: string
          generated_at: string
          id: string
          macro_targets: Json
          meal_plan_data: Json
          model_id: string | null
          projection: Json | null
          source_profile: Json
          updated_at: string
          user_id: string
          workout_plan_data: Json
          workout_setting: string
        }
        Insert: {
          calorie_target: number
          created_at?: string
          generated_at?: string
          id?: string
          macro_targets: Json
          meal_plan_data: Json
          model_id?: string | null
          projection?: Json | null
          source_profile: Json
          updated_at?: string
          user_id: string
          workout_plan_data: Json
          workout_setting: string
        }
        Update: {
          calorie_target?: number
          created_at?: string
          generated_at?: string
          id?: string
          macro_targets?: Json
          meal_plan_data?: Json
          model_id?: string | null
          projection?: Json | null
          source_profile?: Json
          updated_at?: string
          user_id?: string
          workout_plan_data?: Json
          workout_setting?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          default_reps: string
          default_sets: number
          difficulty: string
          equipment: string[]
          exercise_gif_fetched_at: string | null
          exercise_gif_url: string | null
          id: string
          image_attribution_name: string | null
          image_attribution_url: string | null
          image_fetched_at: string | null
          image_url: string | null
          instructions: string | null
          instructions_ka: string | null
          movement_pattern: string
          muscle_group: string
          name: string
          name_ka: string | null
          primary_muscles: string[]
          secondary_muscles: string[]
          setting: string
        }
        Insert: {
          created_at?: string
          default_reps?: string
          default_sets?: number
          difficulty: string
          equipment?: string[]
          exercise_gif_fetched_at?: string | null
          exercise_gif_url?: string | null
          id?: string
          image_attribution_name?: string | null
          image_attribution_url?: string | null
          image_fetched_at?: string | null
          image_url?: string | null
          instructions?: string | null
          instructions_ka?: string | null
          movement_pattern: string
          muscle_group: string
          name: string
          name_ka?: string | null
          primary_muscles?: string[]
          secondary_muscles?: string[]
          setting: string
        }
        Update: {
          created_at?: string
          default_reps?: string
          default_sets?: number
          difficulty?: string
          equipment?: string[]
          exercise_gif_fetched_at?: string | null
          exercise_gif_url?: string | null
          id?: string
          image_attribution_name?: string | null
          image_attribution_url?: string | null
          image_fetched_at?: string | null
          image_url?: string | null
          instructions?: string | null
          instructions_ka?: string | null
          movement_pattern?: string
          muscle_group?: string
          name?: string
          name_ka?: string | null
          primary_muscles?: string[]
          secondary_muscles?: string[]
          setting?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_list_items: {
        Row: {
          checked: boolean
          id: string
          ingredient_key: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          checked?: boolean
          id?: string
          ingredient_key: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          checked?: boolean
          id?: string
          ingredient_key?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          slot: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          slot: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          slot?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          daily_calorie_target: number
          id: string
          macro_targets: Json
          plan_data: Json
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          daily_calorie_target: number
          id?: string
          macro_targets?: Json
          plan_data?: Json
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          daily_calorie_target?: number
          id?: string
          macro_targets?: Json
          plan_data?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          arms_cm: number | null
          chest_cm: number | null
          created_at: string
          date: string
          hips_cm: number | null
          id: string
          thighs_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date: string
          hips_cm?: number | null
          id?: string
          thighs_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          thighs_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[]
          avatar_current: Json | null
          avatar_goal: Json | null
          created_at: string
          dietary_restrictions: string[]
          disclaimer_accepted_at: string | null
          email: string | null
          equipment_setting: string | null
          full_name: string | null
          goal: string | null
          height_cm: number | null
          id: string
          locale: string
          medical_conditions: string | null
          onboarding_completed: boolean
          restrictions_notes: string | null
          sex: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string
          time_available_minutes: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          avatar_current?: Json | null
          avatar_goal?: Json | null
          created_at?: string
          dietary_restrictions?: string[]
          disclaimer_accepted_at?: string | null
          email?: string | null
          equipment_setting?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          locale?: string
          medical_conditions?: string | null
          onboarding_completed?: boolean
          restrictions_notes?: string | null
          sex?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          time_available_minutes?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          avatar_current?: Json | null
          avatar_goal?: Json | null
          created_at?: string
          dietary_restrictions?: string[]
          disclaimer_accepted_at?: string | null
          email?: string | null
          equipment_setting?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          locale?: string
          medical_conditions?: string | null
          onboarding_completed?: boolean
          restrictions_notes?: string | null
          sex?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          time_available_minutes?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          photo_path: string | null
          user_id: string
          weight_kg: number | null
          workout_completed: boolean | null
          workout_notes: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          photo_path?: string | null
          user_id: string
          weight_kg?: number | null
          workout_completed?: boolean | null
          workout_notes?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          photo_path?: string | null
          user_id?: string
          weight_kg?: number | null
          workout_completed?: boolean | null
          workout_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergens: string[]
          calories: number
          carbs_g: number
          created_at: string
          cuisine: string
          description: string | null
          description_ka: string | null
          dietary_tags: string[]
          fat_g: number
          id: string
          image_attribution_name: string | null
          image_attribution_url: string | null
          image_fetched_at: string | null
          image_url: string | null
          ingredients: Json
          instructions: string | null
          instructions_ka: string | null
          meal_type: string
          name: string
          name_ka: string | null
          prep_time_minutes: number
          protein_g: number
        }
        Insert: {
          allergens?: string[]
          calories: number
          carbs_g?: number
          created_at?: string
          cuisine?: string
          description?: string | null
          description_ka?: string | null
          dietary_tags?: string[]
          fat_g?: number
          id?: string
          image_attribution_name?: string | null
          image_attribution_url?: string | null
          image_fetched_at?: string | null
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          instructions_ka?: string | null
          meal_type: string
          name: string
          name_ka?: string | null
          prep_time_minutes?: number
          protein_g?: number
        }
        Update: {
          allergens?: string[]
          calories?: number
          carbs_g?: number
          created_at?: string
          cuisine?: string
          description?: string | null
          description_ka?: string | null
          dietary_tags?: string[]
          fat_g?: number
          id?: string
          image_attribution_name?: string | null
          image_attribution_url?: string | null
          image_fetched_at?: string | null
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          instructions_ka?: string | null
          meal_type?: string
          name?: string
          name_ka?: string | null
          prep_time_minutes?: number
          protein_g?: number
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_sent_at: string | null
          schedule: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          schedule?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          schedule?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_images: {
        Row: {
          attribution_name: string | null
          attribution_url: string | null
          fetched_at: string
          image_url: string | null
          template_id: string
        }
        Insert: {
          attribution_name?: string | null
          attribution_url?: string | null
          fetched_at?: string
          image_url?: string | null
          template_id: string
        }
        Update: {
          attribution_name?: string | null
          attribution_url?: string | null
          fetched_at?: string
          image_url?: string | null
          template_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          id: string
          plan_data: Json
          setting: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_data?: Json
          setting: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_data?: Json
          setting?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
