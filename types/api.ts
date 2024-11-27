export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assistants: {
        Row: {
          inserted_at: string
          model_uuid: string
          name: string
          persona_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          model_uuid: string
          name: string
          persona_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          model_uuid?: string
          name?: string
          persona_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistants_model_id_fkey"
            columns: ["model_uuid"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "assistants_persona_id_fkey"
            columns: ["persona_uuid"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["uuid"]
          },
        ]
      }
      models: {
        Row: {
          api_endpoint: string
          api_key: string | null
          id: string
          inserted_at: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          id: string
          inserted_at?: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          id?: string
          inserted_at?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          avatar_url: string | null
          inserted_at: string
          name: string
          private_knowledge: string | null
          public_knowledge: string | null
          public_perception: string | null
          self_perception: string | null
          user_uuid: string
          uuid: string
        }
        Insert: {
          avatar_url?: string | null
          inserted_at?: string
          name: string
          private_knowledge?: string | null
          public_knowledge?: string | null
          public_perception?: string | null
          self_perception?: string | null
          user_uuid?: string
          uuid?: string
        }
        Update: {
          avatar_url?: string | null
          inserted_at?: string
          name?: string
          private_knowledge?: string | null
          public_knowledge?: string | null
          public_perception?: string | null
          self_perception?: string | null
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      production_assistants: {
        Row: {
          assistant_uuid: string
          inserted_at: string
          production_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          assistant_uuid: string
          inserted_at?: string
          production_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          assistant_uuid?: string
          inserted_at?: string
          production_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_assistants_assistant_uuid_fkey"
            columns: ["assistant_uuid"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "production_assistants_production_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
        ]
      }
      production_persona_evolutions: {
        Row: {
          inserted_at: string
          note_to_self: string | null
          persona_uuid: string
          private_knowledge: string | null
          production_uuid: string
          self_perception: string | null
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          note_to_self?: string | null
          persona_uuid: string
          private_knowledge?: string | null
          production_uuid: string
          self_perception?: string | null
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          note_to_self?: string | null
          persona_uuid?: string
          private_knowledge?: string | null
          production_uuid?: string
          self_perception?: string | null
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_persona_evolutions_persona_uuid_fkey"
            columns: ["persona_uuid"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "production_persona_evolutions_prouction_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
        ]
      }
      production_personas: {
        Row: {
          inserted_at: string
          persona_uuid: string
          production_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          persona_uuid: string
          production_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          persona_uuid?: string
          production_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_personas_persona_uuid_fkey"
            columns: ["persona_uuid"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "production_personas_production_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
        ]
      }
      production_relations: {
        Row: {
          inserted_at: string
          production_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          production_uuid: string
          relation_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          production_uuid?: string
          relation_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_relations_production_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "production_relations_relation_uuid_fkey"
            columns: ["relation_uuid"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["uuid"]
          },
        ]
      }
      productions: {
        Row: {
          inserted_at: string
          name: string | null
          scenario_uuid: string | null
          user_uuid: string
          uuid: string
          world_uuid: string | null
        }
        Insert: {
          inserted_at?: string
          name?: string | null
          scenario_uuid?: string | null
          user_uuid?: string
          uuid?: string
          world_uuid?: string | null
        }
        Update: {
          inserted_at?: string
          name?: string | null
          scenario_uuid?: string | null
          user_uuid?: string
          uuid?: string
          world_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productions_scenario_uuid_fkey"
            columns: ["scenario_uuid"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "productions_world_uuid_fkey"
            columns: ["world_uuid"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["uuid"]
          },
        ]
      }
      relation_personas: {
        Row: {
          inserted_at: string
          persona_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          persona_uuid: string
          relation_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          persona_uuid?: string
          relation_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "relation_personas_persona_uuid_fkey"
            columns: ["persona_uuid"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "relation_personas_relation_uuid_fkey"
            columns: ["relation_uuid"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["uuid"]
          },
        ]
      }
      relations: {
        Row: {
          inserted_at: string
          name: string | null
          private_description: string | null
          public_description: string | null
          user_uuid: string
          uuid: string
        }
        Insert: {
          inserted_at?: string
          name?: string | null
          private_description?: string | null
          public_description?: string | null
          user_uuid?: string
          uuid?: string
        }
        Update: {
          inserted_at?: string
          name?: string | null
          private_description?: string | null
          public_description?: string | null
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          description: string | null
          inserted_at: string
          name: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          description?: string | null
          inserted_at?: string
          name: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          description?: string | null
          inserted_at?: string
          name?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      turns: {
        Row: {
          created_at: string
          inserted_at: string
          message: Json
          parent_turn_uuid: string | null
          production_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at: string
          inserted_at?: string
          message: Json
          parent_turn_uuid?: string | null
          production_uuid: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          inserted_at?: string
          message?: Json
          parent_turn_uuid?: string | null
          production_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "turns_parent_turn_uuid_fkey"
            columns: ["parent_turn_uuid"]
            isOneToOne: false
            referencedRelation: "turns"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "turns_production_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
        ]
      }
      worlds: {
        Row: {
          description: string | null
          inserted_at: string
          name: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          description?: string | null
          inserted_at?: string
          name: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          description?: string | null
          inserted_at?: string
          name?: string
          user_uuid?: string
          uuid?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

