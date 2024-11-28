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
import { LMiXError, ApiError } from '~/types/errors'
import { JSONParser } from '@streamparser/json'

/**
 * Type guards for content properties
 */
const isVectorProperty = (prop: string): prop is keyof Content['vectors'] => {
  return ['position', 'posture', 'direction', 'momentum'].includes(prop)
}

const isTopLevelProperty = (prop: string): prop is keyof Content => {
  return ['performance', 'vectors', 'meta', 'note_to_future_self', 'persona_name'].includes(prop)
}

export const useTurnStore = defineStore('turn', () => {
  // State management
  /**
   * Represents the state of a streaming operation
   * @interface StreamingState
   * @property {boolean} isStreaming - Whether a streaming operation is in progress
   * @property {string | null} error - Error message if the streaming operation failed
   * @property {string | null} assistantUuid - UUID of the assistant currently being streamed
   * @property {string | null} turnUuid - UUID of the turn currently being streamed
   */
  interface StreamingState {
    isStreaming: boolean
    error: string | null
    assistantUuid: string | null
    turnUuid: string | null
  }

  const turns = ref<Turn[]>([])
  const activeTurns = ref<ActiveTurn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const streamingState = ref<StreamingState>({
    isStreaming: false,
    error: null,
    assistantUuid: null,
    turnUuid: null
  })

  // Getters
  /**
   * Retrieves a turn by its UUID
   * @param {string} uuid - UUID of the turn to retrieve
   * @returns {Turn | undefined} The turn data, or undefined if not found
   */
  const getTurn = computed(() => {
    return (uuid: string): Turn | undefined => turns.value.find(t => t.uuid === uuid)
  })

  /**
   * Retrieves all turns for a specific production, sorted by creation date
   * @param {string} productionUuid - UUID of the production to fetch turns for
   * @returns {Turn[]} The list of turns for the production
   */
  const getProductionTurns = computed(() => {
    return (productionUuid: string): Turn[] => turns.value
      .filter(t => t.production_uuid === productionUuid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  /**
   * Retrieves the turn UUID tracked as active for a specific production (or, if none tracked, the latest turn as fallback)
   * @param {string} productionUuid - UUID of the production to fetch the active/latest turn for
   * @returns {string | undefined} The active/latest turn UUID for the production, or undefined if none found
   */
  const getActiveTurnUuid = computed(() => {
    return (productionUuid: string): string | undefined => {
      // First try to get the explicitly set active turn
      const activeTurnUuid = activeTurns.value
        .find(t => t.production_uuid === productionUuid)?.turn_uuid

      // Check if this turn actually exists in our turns array
      if (activeTurnUuid && turns.value.some(t => t.uuid === activeTurnUuid)) {
        return activeTurnUuid
      }

      // If no valid active turn, try to get the latest turn (if any exist)
      return getLatestProductionTurn.value(productionUuid)?.uuid
    }
  })

  /**
   * Retrieves all persona evolutions for a specific production and persona, sorted by creation date
   * @param {string} productionUuid - UUID of the production to fetch evolutions for
   * @param {string} personaUuid - UUID of the persona to fetch evolutions for
   * @returns {Evolutions[]} The list of evolutions for the production and persona
   */
  const getPersonaEvolutions = computed(() => {
    return (productionUuid: string, personaUuid: string): ProductionPersonaEvolution[] => evolutions.value
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
  const getStreamingState = computed((): StreamingState => {
    return streamingState.value
  })

  /**
   * Retrieves the latest turn UUID for a specific production
   * @param {string} productionUuid - UUID of the production to fetch the latest turn for
   * @returns {Turn | undefined} The latest turn UUID for the production, or undefined if none found
   */
  const getLatestProductionTurn = computed(() => {
    return (productionUuid: string): Turn | undefined => turns.value
      .filter(t => t.production_uuid === productionUuid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .at(-1)
  })

  /**
   * Retrieves the ancestor's uuid of a given turn out of a list
   * @param {string} turnUuid - UUID of the turn to find the ancestor for
   * @param {string[]} turnUuids - List of uuids to match against
   * @returns {string | undefined} The matching ancestor uuid, or undefined if not found
   */
  const getAncestorTurnUuid = computed(() => {
    return (turnUuid: string, turnUuids: string[]): string | undefined => {
      const matchingUuid = turnUuids.find(uuid => uuid === turnUuid)

      if (matchingUuid) return matchingUuid

      const turn = getTurn.value(turnUuid)

      if (turn?.parent_turn_uuid) {
        return getAncestorTurnUuid.value(turn.parent_turn_uuid, turnUuids)
      }

      return undefined
    }
  })

  /**
   * Retrieves the immediate children's uuids of a given turn
   * @param {string} productionUuid - UUID of the production
   * @param {string | null} turnUuid - UUID of the turn to find the immediate children for
   * @returns {string[]} The list of immediate children uuids
   */
  const getChildTurnUuids = computed(() => {
    return (productionUuid: string, turnUuid: string | null): string[] =>
      getProductionTurns.value(productionUuid)
        .filter(t => t.parent_turn_uuid === turnUuid)
        .map(t => t.uuid)
  })

  /**
   * Gets the latest descendant turn of a given turn by efficiently traversing the subtree
   * @param {string} turnUuid - UUID of the turn to find the latest descendant for
   * @returns {Turn | undefined} The latest descendant turn, or the turn itself if it has no children
   */
  const getLatestDescendantTurn = computed(() => {
    return (turnUuid: string): Turn | undefined => {
      const turn = turns.value.find(t => t.uuid === turnUuid)
      if (!turn) return undefined

      // Track the latest turn we've found so far
      let latestTurn = turn
      let latestDate = new Date(turn.created_at)

      // Stack-based DFS is more efficient than recursion for this case
      const stack: string[] = [turnUuid]
      const seen = new Set<string>()

      while (stack.length > 0) {
        const currentUuid = stack.pop()!
        if (seen.has(currentUuid)) continue
        seen.add(currentUuid)

        // Use existing computed property to get child UUIDs
        const childUuids = getChildTurnUuids.value(turn.production_uuid, currentUuid)

        // Check each child's timestamp
        for (const childUuid of childUuids) {
          const childTurn = turns.value.find(t => t.uuid === childUuid)
          if (!childTurn) continue

          const childDate = new Date(childTurn.created_at)
          if (childDate > latestDate) {
            latestTurn = childTurn
            latestDate = childDate
          }

          stack.push(childUuid)
        }
      }

      return latestTurn
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
   * @param {string | null} turnUuid - UUID of the turn to set as active
   * @returns {void}
   */
  function setActiveTurn(productionUuid: string, turnUuid: string | null): void {
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

    const originalTurns = [...turns.value]
    const originalActiveTurnUuid = getActiveTurnUuid.value(turn.production_uuid)
    const tempId = crypto.randomUUID()

    // Optimistically insert turn in state
    const stateTurn: Turn = {
      ...turn,
      uuid: tempId,
      inserted_at: new Date().toISOString(),
      user_uuid: useSupabaseUser().value?.id!,
      parent_turn_uuid: turn.parent_turn_uuid || null,
      assistant_uuid: turn.assistant_uuid || null
    }

    turns.value.push(stateTurn)
    setActiveTurn(turn.production_uuid, stateTurn.uuid)

    if (inStateOnly) return stateTurn.uuid

    try {
      const client = useSupabaseClient<Database>()

      // Insert new turn
      const { data: insertedTurn, error: insertError } = await client
        .from('turns')
        .insert({
          ...turn,
          parent_turn_uuid: originalActiveTurnUuid || null
        })
        .select()
        .single()

      if (insertError) {
        throw new ApiError(
          insertError.message,
          insertError,
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

      setActiveTurn(turn.production_uuid, insertedTurn.uuid)
      return insertedTurn.uuid
    }
    catch (e) {
      // Rollback optimistic update
      turns.value = originalTurns
      setActiveTurn(turn.production_uuid, originalActiveTurnUuid || null)

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
    const turn = getTurn.value(turnUuid) as TurnInsert

    if (!turn) throw new LMiXError(
      'Turn not found',
      'TURN_NOT_FOUND',
    )
    const client = useSupabaseClient<Database>()

    const { data: insertedTurn, error: insertError } = await client
      .from('turns')
      .insert({ ...turn, uuid: undefined, inserted_at: undefined })
      .select()
      .single()

    if (insertError) throw new LMiXError(
      insertError.message,
      'API_ERROR',
      insertError,
    )

    if (!insertedTurn) throw new LMiXError(
      'No turn data returned from API',
      'API_ERROR',
    )

    const index = turns.value.findIndex(t => t.uuid === turnUuid)
    if (index !== -1) {
      turns.value[index].uuid = insertedTurn.uuid
      turns.value[index].inserted_at = insertedTurn.inserted_at
    }
    setActiveTurn(turn.production_uuid, insertedTurn.uuid)
    return insertedTurn.uuid
  }

  /**
   * Inserts a new user-generated turn
   * @param {UserTurnMessage} message - User turn message to insert
   * @returns {Promise<void>} Promise that resolves when the turn is inserted
   * @throws {LMiXError} When the API request fails
   */
  async function insertUserTurn(message: UserTurnMessage): Promise<void> {
    let turnUuid: string | undefined = undefined

    // Persist user turn only if it has performance content
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
        },
        created_at: new Date().toISOString(),
      }

      // Insert the user turn
      turnUuid = await insertTurn(userTurn)
    }

    // Insert the assistant turn in response
    await insertAssistantTurn(message.production_uuid, message.receiving_assistant_uuid, turnUuid)
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
   * @param {string | null | undefined} parentTurnUuid - Optional UUID of the parent turn to respond to, or undefined if generating the first turn in a production
   * @returns {Promise<void>} Promise that resolves when the turn is triggered
   * @throws {LMiXError} When assistant or model is not found, or API calls fail
   */
  async function insertAssistantTurn(productionUuid: string, assistantUuid: string, parentTurnUuid?: string | null): Promise<void> {
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
      assistantUuid: assistantUuid,
      turnUuid: null,
    }

    try {
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
        parent_turn_uuid: parentTurnUuid,
        message: {
          role: 'assistant',
          content: {
            persona_name: persona.name,
            performance: '', // Gets replaced by streaming response
          },
          metadata: {
            persona_uuid: assistant.persona_uuid,
          }
        },
        created_at: tempCreatedAt,
        assistant_uuid: assistantUuid
      }

      streamingState.value.turnUuid = await insertTurn(turn, true)

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
        assistantUuid: null,
        turnUuid: null,
      }
    }
  }

  /**
   * Deletes a turn from the database
   * @param {string} uuid - UUID of the turn to delete
   * @returns {Promise<void>} Promise that resolves when the turn is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteTurn(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const turn = getTurn.value(uuid)

    if (!turn) {
      throw new LMiXError(
        'Turn not found',
        'TURN_NOT_FOUND',
      )
    }

    // Set active turn to null
    const originalActiveTurnUuid = getActiveTurnUuid.value(turn.production_uuid)
    setActiveTurn(turn.production_uuid, null)

    const originalTurns = [...turns.value]
    turns.value = turns.value.filter(t => t.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('turns')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
      )
    }
    catch (e) {
      turns.value = originalTurns
      if (originalActiveTurnUuid) setActiveTurn(turn.production_uuid, originalActiveTurnUuid)
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turn deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    turns,
    activeTurns,
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
    getAncestorTurnUuid,
    getChildTurnUuids,
    getLatestDescendantTurn,
    // Actions
    selectTurns,
    insertUserTurn,
    insertAssistantTurn,
    setActiveTurn,
    deleteTurn,
  }
})

// Add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTurnStore, import.meta.hot))
}
