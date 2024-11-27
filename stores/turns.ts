/**
 * Store for managing turns in the application.
 * Handles CRUD operations, state management, and streaming operations for turns.
 * 
 * @remarks
 * Turns represent the back-and-forth communication between users and AI assistants.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type {
  ActiveTurn,
  Content,
  ProductionPersonaEvolution,
  Message,
  Turn,
  TurnInsert,
  UserTurnMessage,
} from '~/types/app'
import { LMiXError, ApiError, ValidationError, AuthenticationError } from '~/types/errors'
import { JSONParser } from '@streamparser/json'

/**
 * Type guards for content properties
 */
const isVectorProperty = (prop: string): prop is keyof Content['vectors'] => {
  return ['location', 'posture', 'direction', 'momentum'].includes(prop)
}

const isEvolutionProperty = (prop: string): prop is keyof Content['evolution'] => {
  return ['self_perception', 'private_knowledge', 'note_to_future_self'].includes(prop)
}

const isTopLevelProperty = (prop: string): prop is keyof Content => {
  return ['performance', 'vectors', 'evolution', 'persona_name', 'meta'].includes(prop)
}

export const useTurnStore = defineStore('turn', () => {
  // State management
  const turns = ref<Turn[]>([])
  const activeTurns = ref<ActiveTurn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const streamingState = ref<StreamingState>({
    isStreaming: false,
    error: null,
    turnUuid: null
  })

  /**
   * Represents the state of a streaming operation
   * @interface StreamingState
   * @property isStreaming - Whether a streaming operation is in progress
   * @property currentPhase - The current phase of the streaming operation
   * @property error - Error message if the streaming operation failed
   * @property turnUuid - UUID of the turn currently being streamed
   */
  interface StreamingState {
    isStreaming: boolean
    error: string | null
    turnUuid: string | null
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
   * Retrieves the turn UUID tracked as active for a specific production (or, if none tracked, the latest turn as fallback)
   * @param {string} productionUuid - UUID of the production to fetch the active/latest turn for
   * @returns {string | undefined} The active/latest turn UUID for the production, or undefined if none found
   */
  const getActiveTurnUuid = computed(() => {
    return (productionUuid: string) => activeTurns.value.find(t => t.production_uuid === productionUuid)?.turn_uuid || getLatestProductionTurn.value(productionUuid)?.uuid
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
      .sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime())
  })

  /**
   * Retrieves the current streaming turn, or null if not streaming
   * @returns {Message | null} The streaming turn data, or null if not streaming
   */
  const getStreamingTurn = computed((): Message | null => {
    if (!streamingState.value.turnUuid) return null
    const turn = turns.value.find(t => t.uuid === streamingState.value.turnUuid)
    return turn?.message || null
  })

  /**
   * Retrieves the current streaming state
   * @returns {StreamingState} The current streaming state
   */
  const getStreamingState = computed(() => {
    return streamingState.value
  })

  /**
   * Retrieves the latest turn UUID for a specific production
   * @param {string} productionUuid - UUID of the production to fetch the latest turn for
   * @returns {Turn | undefined} The latest turn UUID for the production, or undefined if none found
   */
  const getLatestProductionTurn = computed(() => {
    return (productionUuid: string) => turns.value
      .filter(t => t.production_uuid === productionUuid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .at(-1)
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
          .order('inserted_at', { ascending: false })
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
   * Sets the active turn for a production
   * @param {string} productionUuid - UUID of the production to set the active turn for
   * @param {string} turnUuid - UUID of the turn to set as active
   * @returns {void}
   */
  function setActiveTurn(productionUuid: string, turnUuid: string): void {
    const existingIndex = activeTurns.value.findIndex(
      t => t.production_uuid === productionUuid
    )

    if (existingIndex >= 0) {
      activeTurns.value[existingIndex].turn_uuid = turnUuid
    }
    else {
      activeTurns.value.push({ production_uuid: productionUuid, turn_uuid: turnUuid })
    }
  }

  /**
   * Inserts a turn in the database and/or state
   * @param {TurnInsert} turn - Turn data to insert
   * @param {boolean} [inStateOnly=false] - If true, only inserts turn in state, not database
   * @returns {Promise<string>} Promise resolving to the UUID of the inserted/updated turn
   * @throws {LMiXError} When the API request fails
   */
  async function insertTurn(
    turn: TurnInsert,
    inStateOnly: boolean = false
  ): Promise<string> {
    loading.value = true
    error.value = null

    const original = [...turns.value]
    const tempId = crypto.randomUUID()

    // Optimistically insert turn in state
    const stateTurn: Turn = {
      ...turn,
      uuid: tempId,
      inserted_at: new Date().toISOString(),
      user_uuid: useSupabaseUser().value?.id!,
      parent_turn_uuid: turn.parent_turn_uuid || null,
    }

    turns.value.push(stateTurn)

    if (inStateOnly) return stateTurn.uuid

    try {
      const client = useSupabaseClient<Database>()

      // Insert new turn
      const { data: insertedTurn, error: insertError } = await client
        .from('turns')
        .insert(turn)
        .select()
        .single()

      if (insertError) {
        // Convert Supabase errors to appropriate LMiX error types
        if (insertError.code === '42501') {
          throw new AuthenticationError(
            'Not authorized to insert turn',
            insertError
          )
        }
        if (insertError.code === '23502') {
          throw new ValidationError(
            'Missing required fields for turn',
            insertError
          )
        }
        throw new ApiError(
          insertError.message,
          insertError
        )
      }

      if (!insertedTurn) {
        throw new ApiError(
          'No turn data returned from API'
        )
      }

      // Update the optimistic turn with the real data
      const tempIndex = turns.value.findIndex(t => t.uuid === tempId)
      if (tempIndex !== -1) {
        turns.value[tempIndex] = insertedTurn as Turn
      }

      return insertedTurn.uuid
    }
    catch (e) {
      // Rollback optimistic update
      turns.value = original

      // Set error state for UI feedback
      error.value = e as LMiXError

      // Log in development only
      if (import.meta.dev) {
        console.error('Turn insertion failed:', e)
      }

      // Re-throw for UI handling
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Persists a turn in the database
   * @param {string} turnUuid - UUID of the turn to persist
   * @returns {Promise<string>} Promise resolving to the UUID of the persisted turn
   * @throws {LMiXError} When the API request fails
   */
  async function persistTurn(turnUuid: string): Promise<string> {
    const turn = getTurn.value(turnUuid)

    if (!turn) throw new LMiXError('Turn not found', 'TURN_NOT_FOUND')

    const client = useSupabaseClient<Database>()

    const { data: persistedTurn, error: persistError } = await client
      .from('turns')
      .upsert(turn, {
        onConflict: 'uuid'
      })
      .select()
      .single()

    if (persistError) throw new LMiXError(
      persistError.message,
      'API_ERROR',
      persistError,
    )

    return persistedTurn.uuid
  }

  /**
   * Inserts a new user-generated turn
   * @param {UserTurnMessage} message - User turn message to insert
   * @returns {Promise<void>} Promise that resolves when the turn is inserted
   * @throws {LMiXError} When the API request fails
   */
  async function insertUserTurn(message: UserTurnMessage): Promise<void> {
    // Retrieve the potential parent turn UUID
    const activeTurnUuid = getActiveTurnUuid.value(message.production_uuid)
    const userTurnUuid = ref<string | undefined>(undefined)

    // Persist user turn only if it has performance content
    if (message.performance) {
      const userTurn: TurnInsert = {
        production_uuid: message.production_uuid,
        parent_turn_uuid: activeTurnUuid,
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
        },
        created_at: new Date().toISOString(),
      }

      // Insert the user turn and mark it as active
      userTurnUuid.value = await insertTurn(userTurn)
    }

    // Insert the assistant turn in response to the user turn or active turn
    await insertAssistantTurn(message.production_uuid, message.receiving_assistant_uuid, userTurnUuid.value || activeTurnUuid)
  }

  /**
   * Inserts a new assistant-generated turn
   * Handles the complete flow of:
   * 1. Building system context
   * 2. Streaming AI response
   * 3. Processing response content
   * 
   * @param {string} productionUuid - UUID of the production to insert the assistant turn for
   * @param {string} assistantUuid - UUID of the assistant to prompt for a turn
   * @param {string | undefined} turnUuid - UUID of the parent turn to respond to, or undefined if generating the first turn in a production
   * @returns {Promise<void>} Promise that resolves when the turn is triggered
   * @throws {LMiXError} When assistant or model is not found, or API calls fail
   */
  async function insertAssistantTurn(productionUuid: string, assistantUuid: string, turnUuid?: string): Promise<void> {
    const productionStore = useProductionStore()
    const assistantStore = useAssistantStore()
    const personaStore = usePersonaStore()
    const relationStore = useRelationStore()
    const scenarioStore = useScenarioStore()
    const worldStore = useWorldStore()
    const modelStore = useModelStore()

    streamingState.value = {
      isStreaming: true,
      error: null,
      turnUuid: null
    }

    // Create a turn in state only
    const assistant = assistantStore.getAssistant(assistantUuid)

    if (!assistant) {
      throw new LMiXError(
        'Assistant not found',
        'ASSISTANT_NOT_FOUND',
      )
    }

    const persona = personaStore.getPersona(assistant.persona_uuid)

    if (!persona) {
      throw new LMiXError(
        'Persona not found',
        'PERSONA_NOT_FOUND',
      )
    }

    const tempCreatedAt = new Date().toISOString()

    const turn: TurnInsert = {
      user_uuid: useSupabaseUser().value?.id!,
      production_uuid: productionUuid,
      parent_turn_uuid: turnUuid || null,
      message: {
        role: 'assistant',
        content: {
          persona_name: persona.name,
          performance: '', // Gets replaced by streaming response
        },
      },
      created_at: tempCreatedAt,
    }

    // Add placeholder turn to state
    streamingState.value.turnUuid = await insertTurn(turn, true)

    try {
      // Construct system messages based on production configuration
      const systemMessages: { role: 'system', content: string }[] = []
      const production = productionStore.getProduction(productionUuid)

      // Add system message for the production's world
      if (production?.world_uuid) {
        const world = worldStore.getWorld(production.world_uuid)

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
      const assistantPersona = personaStore.getPersona(assistant.persona_uuid)

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
      const productionPersonaUuids = productionStore.getProductionPersonaUuids(productionUuid)
        .filter(uuid => uuid !== assistant.persona_uuid) // Exclude the receiving assistant's persona

      const productionAssistantUuids = productionStore.getProductionAssistantUuids(productionUuid)
        .filter(uuid => uuid !== assistant.uuid) // Exclude the receiving assistant

      const productionAssistantPersonaUuids = productionAssistantUuids
        .map(assistantUuid => {
          const assistant = assistantStore.getAssistant(assistantUuid)
          if (!assistant) return
          return assistant.persona_uuid
        })
        .filter((uuid): uuid is string => uuid !== undefined)

      const personaUuids = [
        ...productionPersonaUuids,
        ...productionAssistantPersonaUuids,
      ]

      for (const personaUuid of personaUuids) {
        const persona = personaStore.getPersona(personaUuid)

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
      const productionRelationUuids = productionStore.getProductionRelationUuids(productionUuid)

      for (const productionRelationUuid of productionRelationUuids) {
        const relation = relationStore.getRelation(productionRelationUuid)
        const relationPersonas = relationStore.getRelationPersonas(productionRelationUuid)

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
        const scenario = scenarioStore.getScenario(production.scenario_uuid)

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

      for (const turn of getProductionTurns.value(productionUuid)) {
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
      const model = modelStore.getModel(assistant.model_uuid)

      if (!model) {
        throw new LMiXError(
          'Model not found',
          'MODEL_NOT_FOUND',
        )
      }

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
        // In the streaming handler, update the turn directly
        const parser = new JSONParser({
          emitPartialTokens: true,
          emitPartialValues: true,
        })

        parser.onValue = ({ value, key, stack }) => {
          if (typeof key !== 'string') return

          const path = stack.map(s => s.key).filter(Boolean) as string[]
          path.push(key)

          // Find the streaming turn in the turns array
          const turnIndex = turns.value.findIndex(t => t.uuid === streamingState.value.turnUuid)
          if (turnIndex === -1) return

          // Create a new turn object to maintain reactivity
          const updatedTurn = { ...turns.value[turnIndex] }
          let content = { ...updatedTurn.message.content }

          // Update the appropriate content field
          if (path.length === 1 && isTopLevelProperty(key)) {
            if (typeof value === 'string') {
              content = { ...content, [key]: value }
            }
          }
          else if (path.length === 2 && path[0] === 'vectors' && isVectorProperty(key)) {
            if (typeof value === 'string') {
              content.vectors = { ...content.vectors, [key]: value }
            }
          }
          else if (path.length === 2 && path[0] === 'evolution' && isEvolutionProperty(key)) {
            if (typeof value === 'string') {
              content.evolution = { ...content.evolution, [key]: value }
            }
          }

          // Update the turn with new content
          updatedTurn.message = {
            ...updatedTurn.message,
            content
          }

          // Update the turn in state
          turns.value[turnIndex] = updatedTurn
        }

        // Process the stream
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          parser.write(chunk)
        }

        // After streaming completes, persist the final turn
        await persistTurn(streamingState.value.turnUuid)

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
      // Remove the temporary turn on error
      turns.value = turns.value.filter(t => t.uuid !== streamingState.value.turnUuid)
      throw e
    }
    finally {
      streamingState.value = {
        isStreaming: false,
        error: null,
        turnUuid: null
      }
    }
  }

  return {
    // State
    turns,
    evolutions,
    loading,
    error,
    streamingState,
    // Getters
    getTurn,
    getProductionTurns,
    getActiveTurnUuid,
    getPersonaEvolutions,
    getStreamingState,
    getStreamingTurn,
    getLatestProductionTurn,
    // Actions
    selectTurns,
    insertTurn,
    insertUserTurn,
    insertAssistantTurn,
  }
})

// Add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTurnStore, import.meta.hot))
}
