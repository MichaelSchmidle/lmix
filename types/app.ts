import type { CoreMessage } from 'ai'
import type { Database } from '@/types/api'
import type Core from 'markdown-it/lib/parser_core.mjs'

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

export type Relation = Database['public']['Tables']['relations']['Row']
export type RelationInsert = Database['public']['Tables']['relations']['Insert']
export type RelationUpdate = Database['public']['Tables']['relations']['Update']

export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert']
export type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update']

export type World = Database['public']['Tables']['worlds']['Row']
export type WorldInsert = Database['public']['Tables']['worlds']['Insert']
export type WorldUpdate = Database['public']['Tables']['worlds']['Update']

export type Production = Database['public']['Tables']['productions']['Row']
export type ProductionInsert = Database['public']['Tables']['productions']['Insert']
export type ProductionUpdate = Database['public']['Tables']['productions']['Update']

export type Turn = Omit<Database['public']['Tables']['turns']['Row'], 'message'> & {
  message: Message
}
export type TurnInsert = Omit<Database['public']['Tables']['turns']['Insert'], 'message'> & {
  message: Message
}
export type TurnUpdate = Omit<Database['public']['Tables']['turns']['Update'], 'message'> & {
  message: Message
}

// Junction tables
export type ProductionAssistant = Database['public']['Tables']['production_assistants']['Row']
export type ProductionAssistantInsert = Database['public']['Tables']['production_assistants']['Insert']
export type ProductionAssistantUpdate = Database['public']['Tables']['production_assistants']['Update']

export type ProductionPersona = Database['public']['Tables']['production_personas']['Row']
export type ProductionPersonaInsert = Database['public']['Tables']['production_personas']['Insert']
export type ProductionPersonaUpdate = Database['public']['Tables']['production_personas']['Update']

export type ProductionPersonaEvolution = Database['public']['Tables']['production_persona_evolutions']['Row']
export type ProductionPersonaEvolutionInsert = Database['public']['Tables']['production_persona_evolutions']['Insert']
export type ProductionPersonaEvolutionUpdate = Database['public']['Tables']['production_persona_evolutions']['Update']

export type ProductionRelation = Database['public']['Tables']['production_relations']['Row']
export type ProductionRelationInsert = Database['public']['Tables']['production_relations']['Insert']
export type ProductionRelationUpdate = Database['public']['Tables']['production_relations']['Update']

export type RelationPersona = Database['public']['Tables']['relation_personas']['Row']
export type RelationPersonaInsert = Database['public']['Tables']['relation_personas']['Insert']
export type RelationPersonaUpdate = Database['public']['Tables']['relation_personas']['Update']

// Extended insert type that includes relation UUIDs
export type ProductionWithRelationsInsert = ProductionInsert & {
  // These match the form field names in the component
  production_assistant_uuids?: string[]
  production_persona_uuids?: string[]
  production_relation_uuids?: string[]
}

// Extended types with relations
export type AssistantWithRelations = Assistant & {
  persona?: Persona | null
}

export type ProductionAssistantWithRelations = ProductionAssistant & {
  assistant: Assistant
}

export type ProductionPersonaWithRelations = ProductionPersona & {
  persona: Persona
}

export type ProductionRelationWithRelations = ProductionRelation & {
  relation: RelationWithRelations
}

export type RelationPersonaWithRelations = RelationPersona & {
  persona: Persona
}

export type RelationWithRelations = Relation & {
  relation_personas?: RelationPersonaWithRelations[]
}

// Extended type with full relations (for responses)
export type ProductionWithRelations = Production & {
  world?: World | null
  scenario?: Scenario | null
  production_assistants?: ProductionAssistantWithRelations[]
  production_personas?: ProductionPersonaWithRelations[]
  production_relations?: ProductionRelationWithRelations[]
}

export type Content = {
  persona_name: string
  performance: string
  vectors?: {
    location?: string
    posture?: string
    direction?: string
    momentum?: string
  }
  evolution?: {
    self_perception?: string
    private_knowledge?: string
    note_to_future_self?: string
  }
  meta?: string
}

// Turn user message
export type UserTurnMessage = {
  production_uuid: string
  performance?: string
  sending_persona_uuid?: string
  receiving_assistant_uuid: string
}

export type Message = Omit<CoreMessage, 'content'> & {
  content: Content
  metadata?: {
    persona_uuid?: string
  }
}
