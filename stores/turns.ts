/**
 * Store for managing turns in the application.
 * Handles CRUD operations, state management, and streaming operations for turns.
 * 
 * @remarks
 * Turns represent the back-and-forth communication between users and AI assistants.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Turn, TurnInsert, ProductionPersonaEvolution, UserTurnMessage, Content, Message } from '~/types/app'
import { LMiXError } from '~/types/errors'
import { JSONParser } from '@streamparser/json'

export const useTurnStore = defineStore('turn', () => {
  // State management
  const turns = ref<Turn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const streamingTurn = ref<Partial<Content>>({})
  const streamingState = ref<StreamingState>({
    isStreaming: false,
    currentPhase: null,
    error: null
  })

  /**
   * Represents the state of a streaming operation
   * @interface StreamingState
   * @property isStreaming - Whether a streaming operation is in progress
   * @property currentPhase - The current phase of the streaming operation
   * @property error - Error message if the streaming operation failed
   */
  interface StreamingState {
    isStreaming: boolean
    currentPhase: 'performing' | 'vectorizing' | 'evolving' | 'commenting' | null
    error: string | null
  }

  /**
   * Interface for JSON parser callback elements
   * @interface ParsedElement
   * @property value - The parsed value
   * @property key - Optional key if the value is part of an object
   * @property parent - Optional parent object or array
   * @property stack - Optional stack of parent objects/arrays
   * @property partial - Whether this is a partial parse result
   */
  interface ParsedElement {
    value: unknown
    key?: string | number
    parent?: unknown
    stack?: unknown[]
    partial?: boolean
  }

  // Getters
  /**
   * Retrieves a turn by its UUID
   * @param {string} uuid - UUID of the turn to retrieve
   * @returns {Turn | undefined} The turn data, or undefined if not found
   */
  const getTurn = computed(() => {
    return (uuid: string) => turns.value.find(t => t.uuid === uuid)
  })

  /**
   * Retrieves all turns for a specific production, sorted by creation date
   * @param {string} productionUuid - UUID of the production to fetch turns for
   * @returns {Turn[]} The list of turns for the production
   */
  const getProductionTurns = computed(() => {
    return (productionUuid: string) => turns.value
      .filter(t => t.production_uuid === productionUuid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  /**
   * Retrieves all persona evolutions for a specific production and persona, sorted by creation date
   * @param {string} productionUuid - UUID of the production to fetch evolutions for
   * @param {string} personaUuid - UUID of the persona to fetch evolutions for
   * @returns {Evolutions[]} The list of evolutions for the production and persona
   */
  const getPersonaEvolutions = computed(() => {
    return (productionUuid: string, personaUuid: string) => evolutions.value
      .filter(e =>
        e.production_uuid === productionUuid &&
        e.persona_uuid === personaUuid
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  /**
   * Retrieves the current streaming turn, or null if not streaming
   * @returns {Message | null} The streaming turn data, or null if not streaming
   */
  const getStreamingTurn = computed((): Message | null => {
    if (!streamingTurn.value || Object.keys(streamingTurn.value).length === 0) {
      return null
    }
    return {
      role: 'assistant',
      content: streamingTurn.value as Content
    }
  })

  // Actions
  /**
   * Fetches all turns for a specific production
   * @param {string} productionUuid - UUID of the production to fetch turns for
   * @returns {Promise<void>} Promise that resolves when the turns are fetched
   * @throws {LMiXError} When the API request fails
   */
  async function selectTurns(productionUuid: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      // Fetch turns and latest evolutions in parallel
      const [turnsResult, evolutionsResult] = await Promise.all([
        client
          .from('turns')
          .select('*')
          .eq('production_uuid', productionUuid)
          .order('created_at'),

        client
          .from('production_persona_evolutions')
          .select('*', {
            count: 'exact',
            head: true
          })
          .eq('production_uuid', productionUuid)
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      if (turnsResult.error) throw new LMiXError(
        turnsResult.error.message,
        'API_ERROR',
        turnsResult.error,
      )

      if (evolutionsResult.error) throw new LMiXError(
        evolutionsResult.error.message,
        'API_ERROR',
        evolutionsResult.error,
      )

      turns.value = turnsResult.data as Turn[] || []
      evolutions.value = evolutionsResult.data || []
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turns fetch failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates a new turn in the database
   * @param {TurnInsert} turn - Turn data to insert
   * @returns {Promise<string>} Promise resolving to the UUID of the inserted turn
   * @throws {LMiXError} When the API request fails
   */
  async function insertTurn(
    turn: TurnInsert,
  ): Promise<string> {
    loading.value = true
    error.value = null
    const tempId = crypto.randomUUID()

    const original = {
      turns: [...turns.value],
      evolutions: [...evolutions.value]
    }

    // Optimistic update
    const newTurn = {
      ...turn,
      uuid: tempId,
      created_at: new Date().toISOString(),
      user_uuid: useSupabaseUser().value?.id!,
      parent_turn_uuid: turn.parent_turn_uuid || null,
    }

    turns.value.push(newTurn)

    try {
      const client = useSupabaseClient<Database>()

      // Insert new turn
      const { data: insertedTurn, error: insertedTurnError } = await client
        .from('turns')
        .insert(turn)
        .select()
        .single()

      if (insertedTurnError) throw new LMiXError(
        insertedTurnError.message,
        'API_ERROR',
        insertedTurnError,
      )

      if (!insertedTurn) throw new LMiXError(
        'Turn was not inserted',
        'API_ERROR',
      )

      return insertedTurn.uuid
    }
    catch (e) {
      // Rollback on failure
      turns.value = original.turns
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turn creation failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Triggers a new turn in response to a user message
   * Handles the complete flow of:
   * 1. Persisting user message
   * 2. Building system context
   * 3. Streaming AI response
   * 4. Processing response content
   * 
   * @param {UserTurnMessage} message - User message and context data
   * @returns {Promise<void>} Promise that resolves when the turn is triggered
   * @throws {LMiXError} When assistant or model is not found, or API calls fail
   */
  async function triggerTurn(message: UserTurnMessage) {
    streamingState.value = {
      isStreaming: true,
      currentPhase: null,
      error: null
    }

    const assistant = useAssistantStore().getAssistant(message.receiving_assistant_uuid)

    if (!assistant) {
      throw new LMiXError(
        'Assistant not found',
        'ASSISTANT_NOT_FOUND',
      )
    }

    const model = useModelStore().getModel(assistant?.model_uuid)

    if (!model) {
      throw new LMiXError(
        'Model not found',
        'MODEL_NOT_FOUND',
      )
    }

    streamingTurn.value = {}

    try {
      const userTurnUuid = ref<string | null>(null)

      // First, persist the user's message if applicable (i.e., if performance is provided)
      if (message.performance) {
        const userTurn: TurnInsert = {
          production_uuid: message.production_uuid,
          message: {
            role: 'user',
            content: {
              performance: message.performance,
              persona_name: message.sending_persona_uuid
                ? usePersonaStore().getPersona(message.sending_persona_uuid)?.name || 'User'
                : 'User',
            },
            metadata: message.sending_persona_uuid
              ? { persona_uuid: message.sending_persona_uuid }
              : undefined
          }
        }

        userTurnUuid.value = await insertTurn(userTurn)
      }

      // Construct system messages based on production configuration
      const systemMessages: { role: 'system', content: string }[] = []
      const production = useProductionStore().getProduction(message.production_uuid)

      // Add system message for the production's world
      if (production?.world_uuid) {
        const world = useWorldStore().getWorld(production.world_uuid)

        if (world) {
          systemMessages.push({
            role: 'system',
            content: JSON.stringify({
              world: {
                name: world.name,
                description: world.description ?? undefined
              },
            })
          })
        }
      }

      // Add system messages for the production's personas
      // Start with the receiving assistant's persona
      const assistantPersona = usePersonaStore().getPersona(assistant.persona_uuid)

      if (assistantPersona) {
        systemMessages.push({
          role: 'system',
          content: JSON.stringify({
            your_persona: {
              name: assistantPersona.name,
              public_knowledge: assistantPersona.public_knowledge,
              self_perception: assistantPersona.self_perception,
              private_knowledge: assistantPersona.private_knowledge,
            },
          })
        })
      }

      // Add production personas
      const productionPersonaUuids = useProductionStore().getProductionPersonas(message.production_uuid)
        .filter(uuid => uuid !== assistant.persona_uuid) // Exclude the receiving assistant's persona

      const productionAssistantUuids = useProductionStore().getProductionAssistants(message.production_uuid)
        .filter(uuid => uuid !== assistant.uuid) // Exclude the receiving assistant

      const productionAssistantPersonaUuids = productionAssistantUuids
        .map(assistantUuid => {
          const assistant = useAssistantStore().getAssistant(assistantUuid)
          if (!assistant) return
          return assistant.persona_uuid
        })
        .filter((uuid): uuid is string => uuid !== undefined)

      const personaUuids = [
        ...productionPersonaUuids,
        ...productionAssistantPersonaUuids,
      ]

      for (const personaUuid of personaUuids) {
        const persona = usePersonaStore().getPersona(personaUuid)

        if (persona) {
          systemMessages.push({
            role: 'system',
            content: JSON.stringify({
              other_persona: {
                name: persona.name,
                public_perception: persona.public_perception,
                public_knowledge: persona.public_knowledge,
              },
            })
          })
        }
      }

      // Add system message for the production's relations between personas
      const productionRelationUuids = useProductionStore().getProductionRelations(message.production_uuid)

      for (const productionRelationUuid of productionRelationUuids) {
        const relation = useRelationStore().getRelation(productionRelationUuid)
        const relationPersonas = useRelationStore().getRelationPersonas(productionRelationUuid)

        // Determin if assistant's persona is involved in the relation
        const isOwnRelation = relationPersonas.includes(assistant.persona_uuid)
        const propertyPrefix = isOwnRelation ? 'your_' : 'other_'

        if (relation) {
          systemMessages.push({
            role: 'system',
            content: JSON.stringify({
              [`${propertyPrefix}relation`]: {
                name: useRelationStore().getRelationLabel(relation.uuid),
                description: isOwnRelation ? relation.private_description : relation.public_description
              },
            })
          })
        }
      }

      // Add system message for the production's scenario if applicable
      if (production?.scenario_uuid) {
        const scenario = useScenarioStore().getScenario(production.scenario_uuid)

        if (scenario) {
          systemMessages.push({
            role: 'system',
            content: JSON.stringify({
              scenario: {
                name: scenario.name,
                description: scenario.description ?? undefined
              },
            })
          })
        }
      }

      // Construct user and assistant message history
      const messages: { role: 'user' | 'assistant', content: string }[] = []

      for (const turn of useTurnStore().getProductionTurns(message.production_uuid)) {
        messages.push({
          role: turn.message.role,
          // TODO: Add persona evolutions
          content: JSON.stringify(
            {
              persona_name: turn.message.content.persona_name,
              performance: turn.message.content.performance,
              vectors: turn.message.content.vectors,
            },
          ),
        })
      }

      // Call the API to trigger assistant turn
      const response = await fetch('/api/turns', {
        method: 'POST',
        body: JSON.stringify({
          api: {
            key: model.api_key,
            endpoint: model.api_endpoint,
          },
          messages: [...systemMessages, ...messages],
          model: model.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Handle the streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        const streamingTurnValue: Partial<{
          performance?: string
          persona_name?: string
          meta?: string
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
        }> = {}

        // Create JSON parser with partial value emission
        const parser = new JSONParser({
          emitPartialTokens: true,
          emitPartialValues: true,
        })

        // Handle parser errors
        parser.onError = (error) => {
          throw new LMiXError(
            'Failed to parse streaming response',
            'STREAM_PARSE_ERROR',
            error,
          )
        }

        // Type guards for different property types
        const isVectorProperty = (prop: string): prop is keyof Content['vectors'] => {
          return ['location', 'posture', 'direction', 'momentum'].includes(prop)
        }

        const isEvolutionProperty = (prop: string): prop is keyof Content['evolution'] => {
          return ['self_perception', 'private_knowledge', 'note_to_future_self'].includes(prop)
        }

        const isTopLevelProperty = (prop: string): prop is keyof Content => {
          return ['performance', 'vectors', 'evolution', 'persona_name', 'meta'].includes(prop)
        }

        // Handle parsed values
        parser.onValue = ({ value, key, parent, stack, partial }) => {
          if (typeof key !== 'string') return

          // Get the full path to this value
          const path = stack.map(s => s.key).filter(Boolean) as string[]
          path.push(key)

          // Handle different paths
          if (path.length === 1 && isTopLevelProperty(key)) {
            // Top-level properties like 'performance' and 'meta'
            if (typeof value === 'string') {
              streamingTurnValue[key] = value
              streamingTurn.value = { ...streamingTurnValue }
            }
          }
          else if (path.length === 2 && path[0] === 'vectors' && isVectorProperty(key)) {
            // Nested properties under 'vectors'
            if (typeof value === 'string') {
              if (!streamingTurnValue.vectors) {
                streamingTurnValue.vectors = {
                  location: undefined,
                  posture: undefined,
                  direction: undefined,
                  momentum: undefined,
                }
              }

              (streamingTurnValue.vectors as any)[key] = value
              streamingTurn.value = { ...streamingTurnValue }
            }
          }
          else if (path.length === 2 && path[0] === 'evolution' && isEvolutionProperty(key)) {
            // Nested properties under 'evolution'
            if (typeof value === 'string') {
              if (!streamingTurnValue.evolution) {
                streamingTurnValue.evolution = {
                  self_perception: undefined,
                  private_knowledge: undefined,
                  note_to_future_self: undefined,
                }
              }

              (streamingTurnValue.evolution as any)[key] = value
              streamingTurn.value = { ...streamingTurnValue }
            }
          }
        }

        // Process the stream
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          parser.write(chunk)
        }

        // After streaming completes, prepare the content for persistence
        let sanitizedContent: Content
        try {
          // Validate that we have a performance - it's the core requirement
          if (!streamingTurn.value.performance) {
            throw new LMiXError(
              'Assistant response missing required performance content',
              'STREAM_ERROR',
            )
          }

          sanitizedContent = {
            persona_name: streamingTurn.value.persona_name || 'Assistant',
            performance: streamingTurn.value.performance,
          }

          // Only add optional fields if they contain valid data
          if (streamingTurn.value.vectors) {
            sanitizedContent.vectors = {
              location: streamingTurn.value.vectors.location,
              posture: streamingTurn.value.vectors.posture,
              direction: streamingTurn.value.vectors.direction,
              momentum: streamingTurn.value.vectors.momentum,
            }
          }

          if (streamingTurn.value.evolution) {
            sanitizedContent.evolution = {
              self_perception: streamingTurn.value.evolution.self_perception,
              private_knowledge: streamingTurn.value.evolution.private_knowledge,
              note_to_future_self: streamingTurn.value.evolution.note_to_future_self,
            }
          }

          // For meta, ensure it's a string and doesn't contain nested objects
          if (typeof streamingTurn.value.meta === 'string') {
            sanitizedContent.meta = streamingTurn.value.meta
          }

          // Persist the assistant's response
          const assistantTurn: TurnInsert = {
            production_uuid: message.production_uuid,
            parent_turn_uuid: userTurnUuid.value,
            message: {
              role: 'assistant',
              content: sanitizedContent,
            }
          }
          await insertTurn(assistantTurn)
        }
        finally {
          streamingTurn.value = {}
          streamingState.value.isStreaming = false
        }
      }
      catch (e) {
        streamingState.value.error = e instanceof LMiXError
          ? e.message
          : 'Failed to process streaming response'

        if (import.meta.dev) console.error('Turn streaming failed:', e)

        throw e instanceof LMiXError
          ? e
          : new LMiXError(
            'Failed to process streaming response',
            'STREAM_ERROR',
            e,
          )
      }
    }
    catch (e) {
      streamingState.value.error = e instanceof Error ? e.message : 'An error occurred'
      if (import.meta.dev) console.error('Turn creation failed:', e)
    }
    finally {
      streamingState.value.isStreaming = false
      streamingState.value.currentPhase = null
    }
  }

  return {
    // State
    turns,
    evolutions,
    loading,
    error,
    streamingState,
    streamingTurn,
    // Getters
    getTurn,
    getProductionTurns,
    getPersonaEvolutions,
    getStreamingTurn,
    // Actions
    selectTurns,
    insertTurn,
    triggerTurn,
  }
})

/**
 * Type guard to check if a string is a valid Content property
 * @param prop - Property to check
 * @returns Whether the property is a valid Content property
 */
const isContentProperty = (prop: string): prop is keyof Content => {
  return [
    'performance',
    'persona_name',
    'vectors',
    'location',
    'posture',
    'direction',
    'momentum',
    'evolution',
    'self_perception',
    'private_knowledge',
    'note_to_future_self',
    'meta'
  ].includes(prop)
}

// Add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTurnStore, import.meta.hot))
}
