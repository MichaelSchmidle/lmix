import type { Database } from '@/types/api'

export type ApiConfiguration = {
  api_endpoint: string
  api_key?: string
}

export type ApiModelList = {
  data: ApiModel[]
  object: 'list'
}

export type ApiModel = {
  id: string
}

export type ApiModelOption = {
  label: string
  value: string
  help?: string
  attrs?: {
    disabled?: boolean
    [key: string]: any
  }
}

// Core entities
export type Model = Database['public']['Tables']['models']['Row']
export type ModelInsert = Database['public']['Tables']['models']['Insert']
export type ModelUpdate = Database['public']['Tables']['models']['Update']

export type Persona = Database['public']['Tables']['personas']['Row']
export type PersonaInsert = Database['public']['Tables']['personas']['Insert']
export type PersonaUpdate = Database['public']['Tables']['personas']['Update']

export type Assistant = Database['public']['Tables']['assistants']['Row']
export type AssistantInsert = Database['public']['Tables']['assistants']['Insert']
export type AssistantUpdate = Database['public']['Tables']['assistants']['Update']

export type World = Database['public']['Tables']['worlds']['Row']
export type WorldInsert = Database['public']['Tables']['worlds']['Insert']
export type WorldUpdate = Database['public']['Tables']['worlds']['Update']

export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert']
export type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update']

export type Production = Database['public']['Tables']['productions']['Row']
export type ProductionInsert = Database['public']['Tables']['productions']['Insert']
export type ProductionUpdate = Database['public']['Tables']['productions']['Update']

export type Relationship = Database['public']['Tables']['relationships']['Row']
export type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']
export type RelationshipUpdate = Database['public']['Tables']['relationships']['Update']

// Junction tables
export type ProductionAssistant = Database['public']['Tables']['production_assistants']['Row']
export type ProductionAssistantInsert = Database['public']['Tables']['production_assistants']['Insert']
export type ProductionAssistantUpdate = Database['public']['Tables']['production_assistants']['Update']

export type ProductionPersona = Database['public']['Tables']['production_personas']['Row']
export type ProductionPersonaInsert = Database['public']['Tables']['production_personas']['Insert']
export type ProductionPersonaUpdate = Database['public']['Tables']['production_personas']['Update']

export type ProductionRelationship = Database['public']['Tables']['production_relationships']['Row']
export type ProductionRelationshipInsert = Database['public']['Tables']['production_relationships']['Insert']
export type ProductionRelationshipUpdate = Database['public']['Tables']['production_relationships']['Update']

export type RelationshipPersona = Database['public']['Tables']['relationship_personas']['Row']
export type RelationshipPersonaInsert = Database['public']['Tables']['relationship_personas']['Insert']
export type RelationshipPersonaUpdate = Database['public']['Tables']['relationship_personas']['Update']

// Extended insert type that includes relationship UUIDs
export type ProductionWithRelationsInsert = ProductionInsert & {
  // These match the form field names in the component
  production_assistant_uuids?: string[]
  production_persona_uuids?: string[]
  production_relationship_uuids?: string[]
}

// Extended type with full relations (for responses)
export type ProductionWithRelations = Production & {
  world?: World | null
  scenario?: Scenario | null
  production_assistants: {
    uuid: string
    assistant: Assistant
  }[]
  production_personas?: {
    uuid: string
    persona: Persona
  }[]
  production_relationships?: {
    uuid: string
    relationship: Relationship & {
      relationship_personas?: {
        uuid: string
        persona: Persona
      }[]
    }
  }[]
}
