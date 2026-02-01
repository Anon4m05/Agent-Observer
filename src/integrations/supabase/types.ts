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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          avatar_url: string | null
          bio: string | null
          comment_count: number | null
          created_at: string
          display_name: string | null
          external_id: string
          first_seen_at: string
          id: string
          last_seen_at: string | null
          metadata: Json | null
          post_count: number | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          comment_count?: number | null
          created_at?: string
          display_name?: string | null
          external_id: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          post_count?: number | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          comment_count?: number | null
          created_at?: string
          display_name?: string | null
          external_id?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          post_count?: number | null
          username?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          agent_id: string | null
          char_count: number | null
          content: string | null
          created_at: string
          downvotes: number | null
          external_id: string
          id: string
          metadata: Json | null
          parent_comment_id: string | null
          post_id: string | null
          posted_at: string | null
          reply_depth: number | null
          scraped_at: string
          upvotes: number | null
          word_count: number | null
        }
        Insert: {
          agent_id?: string | null
          char_count?: number | null
          content?: string | null
          created_at?: string
          downvotes?: number | null
          external_id: string
          id?: string
          metadata?: Json | null
          parent_comment_id?: string | null
          post_id?: string | null
          posted_at?: string | null
          reply_depth?: number | null
          scraped_at?: string
          upvotes?: number | null
          word_count?: number | null
        }
        Update: {
          agent_id?: string | null
          char_count?: number | null
          content?: string | null
          created_at?: string
          downvotes?: number | null
          external_id?: string
          id?: string
          metadata?: Json | null
          parent_comment_id?: string | null
          post_id?: string | null
          posted_at?: string | null
          reply_depth?: number | null
          scraped_at?: string
          upvotes?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          agent_id: string | null
          avg_word_length: number | null
          char_count: number | null
          comment_count: number | null
          content: string | null
          created_at: string
          downvotes: number | null
          external_id: string
          id: string
          link_count: number | null
          metadata: Json | null
          posted_at: string | null
          scraped_at: string
          submolt_id: string | null
          title: string | null
          unique_words: number | null
          upvotes: number | null
          url: string | null
          word_count: number | null
        }
        Insert: {
          agent_id?: string | null
          avg_word_length?: number | null
          char_count?: number | null
          comment_count?: number | null
          content?: string | null
          created_at?: string
          downvotes?: number | null
          external_id: string
          id?: string
          link_count?: number | null
          metadata?: Json | null
          posted_at?: string | null
          scraped_at?: string
          submolt_id?: string | null
          title?: string | null
          unique_words?: number | null
          upvotes?: number | null
          url?: string | null
          word_count?: number | null
        }
        Update: {
          agent_id?: string | null
          avg_word_length?: number | null
          char_count?: number | null
          comment_count?: number | null
          content?: string | null
          created_at?: string
          downvotes?: number | null
          external_id?: string
          id?: string
          link_count?: number | null
          metadata?: Json | null
          posted_at?: string | null
          scraped_at?: string
          submolt_id?: string | null
          title?: string | null
          unique_words?: number | null
          upvotes?: number | null
          url?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_submolt_id_fkey"
            columns: ["submolt_id"]
            isOneToOne: false
            referencedRelation: "submolts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrape_jobs: {
        Row: {
          agents_discovered: number | null
          comments_scraped: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          posts_scraped: number | null
          scope: string
          started_at: string | null
          status: string
          target_id: string | null
          user_id: string
        }
        Insert: {
          agents_discovered?: number | null
          comments_scraped?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          posts_scraped?: number | null
          scope?: string
          started_at?: string | null
          status?: string
          target_id?: string | null
          user_id: string
        }
        Update: {
          agents_discovered?: number | null
          comments_scraped?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          posts_scraped?: number | null
          scope?: string
          started_at?: string | null
          status?: string
          target_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_scrape_enabled: boolean | null
          created_at: string
          id: string
          last_auto_scrape_at: string | null
          scrape_interval_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_scrape_enabled?: boolean | null
          created_at?: string
          id?: string
          last_auto_scrape_at?: string | null
          scrape_interval_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_scrape_enabled?: boolean | null
          created_at?: string
          id?: string
          last_auto_scrape_at?: string | null
          scrape_interval_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      submolts: {
        Row: {
          created_at: string
          description: string | null
          external_id: string
          first_seen_at: string
          id: string
          last_scraped_at: string | null
          member_count: number | null
          metadata: Json | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id: string
          first_seen_at?: string
          id?: string
          last_scraped_at?: string | null
          member_count?: number | null
          metadata?: Json | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string
          first_seen_at?: string
          id?: string
          last_scraped_at?: string | null
          member_count?: number | null
          metadata?: Json | null
          name?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
