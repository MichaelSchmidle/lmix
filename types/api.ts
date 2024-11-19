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
          created_at: string
          model_uuid: string
          name: string
          persona_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          model_uuid: string
          name: string
          persona_uuid: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          id: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          created_at?: string
          id: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          created_at?: string
          id?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          created_at: string
          name: string
          private_knowledge: string | null
          public_knowledge: string | null
          public_perception: string | null
          self_perception: string | null
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          name: string
          private_knowledge?: string | null
          public_knowledge?: string | null
          public_perception?: string | null
          self_perception?: string | null
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          production_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          assistant_uuid: string
          created_at?: string
          production_uuid: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          assistant_uuid?: string
          created_at?: string
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
      production_personas: {
        Row: {
          created_at: string
          persona_uuid: string
          production_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          persona_uuid: string
          production_uuid: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          production_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          production_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
          production_uuid?: string
          relation_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_relations_relation_uuid_fkey"
            columns: ["relation_uuid"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "production_relationships_production_uuid_fkey"
            columns: ["production_uuid"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["uuid"]
          },
        ]
      }
      productions: {
        Row: {
          created_at: string
          name: string | null
          scenario_uuid: string | null
          user_uuid: string
          uuid: string
          world_uuid: string | null
        }
        Insert: {
          created_at?: string
          name?: string | null
          scenario_uuid?: string | null
          user_uuid: string
          uuid?: string
          world_uuid?: string | null
        }
        Update: {
          created_at?: string
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
          created_at: string
          persona_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          persona_uuid: string
          relation_uuid: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
          persona_uuid?: string
          relation_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_members_persona_uuid_fkey"
            columns: ["persona_uuid"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "relationship_members_relationship_uuid_fkey"
            columns: ["relation_uuid"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["uuid"]
          },
        ]
      }
      relations: {
        Row: {
          created_at: string
          name: string | null
          private_description: string | null
          public_description: string | null
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          name?: string | null
          private_description?: string | null
          public_description?: string | null
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          description: string | null
          name: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          name: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          name?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: []
      }
      worlds: {
        Row: {
          created_at: string
          description: string | null
          name: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          name: string
          user_uuid: string
          uuid?: string
        }
        Update: {
          created_at?: string
          description?: string | null
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

