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
  Message,
  Turn,
  TurnInsert,
  UserTurnMessage,
  TurnUpdate,
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
  return ['performance', 'vectors', 'meta', 'note_to_self', 'persona_name'].includes(prop)
}

export const useTurnStore = defineStore('turn', () => {
  // Reset state
  function $reset() {
    turns.value = []
    activeTurns.value = []
    loading.value = false
    error.value = null
  }

  // State
  const turns = ref<Turn[]>([])
  const activeTurns = ref<ActiveTurn[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const streamingState = ref<StreamingState>({
    isStreaming: false,
    error: null,
    assistantUuid: null,
    turnUuid: null,
    streamingProperties: new Set(),
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

      // Fetch turns
      const { data: selectedTurns, error: selectError } = await client
        .from('turns')
        .select('*')
        .eq('production_uuid', productionUuid)
        .order('created_at')

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError,
      )

      turns.value = selectedTurns as Turn[] || []
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
      assistant_uuid: turn.assistant_uuid || null,
      is_directive: turn.is_directive ?? false,
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
      // Strip the / character and trim whitespace if this is a directive message
      const performance = message.is_directive
        ? message.performance.trimStart().substring(1).trim()
        : message.performance

      const userTurn: TurnInsert = {
        production_uuid: message.production_uuid,
        is_directive: message.is_directive ?? false,
        message: {
          role: 'user',
          content: {
            performance,
            persona_name: message.sending_persona_uuid && !message.is_directive
              ? usePersonaStore().getPersona(message.sending_persona_uuid)?.name || 'User'
              : 'User',
          },
          metadata: message.sending_persona_uuid && !message.is_directive
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
      streamingProperties: new Set(),
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
              universal: assistantPersona.universal,
              internal: assistantPersona.internal,
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

        // Only include personas that are "tangible" for others (via universal or external properties)
        if (persona && (persona.universal || persona.external)) {
          systemMessages.push({
            role: 'system',
            content: JSON.stringify({
              other_persona: {
                name: persona.name,
                universal: persona.universal,
                external: persona.external,
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
                universal: relation.universal,
                internal: isOwnRelation ? relation.internal : undefined,
                external: isOwnRelation ? undefined : relation.external,
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

      // If there's a parent turn, collect all ancestor turns up to the root
      const turnUuidsInBranch: string[] = []
      if (parentTurnUuid) {
        let currentTurnUuid: string | null = parentTurnUuid
        while (currentTurnUuid) {
          turnUuidsInBranch.unshift(currentTurnUuid) // Add at start to maintain chronological order
          const turn = getTurn.value(currentTurnUuid)
          currentTurnUuid = turn?.parent_turn_uuid ?? null
        }
      }

      // Get the turns in chronological order and filter to only include those in the branch
      const branchTurns = getProductionTurns.value(productionUuid)
        .filter(turn => turnUuidsInBranch.includes(turn.uuid))
        // Filter out directive messages unless they're the last message
        .filter((turn, index, array) => {
          if (!turn.is_directive) return true
          return index === array.length - 1
        })

      for (const turn of branchTurns) {
        messages.push({
          role: turn.message.role,
          content: JSON.stringify({
            persona_name: turn.message.content.persona_name,
            performance: turn.message.content.performance,
            vectors: turn.message.content.vectors,
            // Include meta and note_to_self only if the turn is the assistant's
            meta: turn.assistant_uuid === assistantUuid ? turn.message.content.meta : undefined,
            note_to_self: turn.assistant_uuid === assistantUuid ? turn.message.content.note_to_self : undefined,
          }),
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
          paths: ['$.*'],
          keepStack: false,
          emitPartialTokens: true,
          emitPartialValues: true,
        })

        parser.onValue = ({ value, key, stack }) => {
          const keyStr = String(key)
          if (!keyStr || stack.length !== 1) return

          // Track streaming properties at the top level
          if (isTopLevelProperty(keyStr)) {
            streamingState.value.streamingProperties.add(keyStr)
          }

          // Handle nested vector properties
          if (keyStr === 'vectors' && typeof value === 'object' && value !== null) {
            for (const vectorKey in value) {
              if (isVectorProperty(vectorKey) && value[vectorKey] !== undefined) {
                streamingState.value.streamingProperties.add('vectors')
                break
              }
            }
          }

          // Update turn content
          const turn = turns.value.find(t => t.uuid === streamingState.value.turnUuid)
          if (!turn) return

          if (isTopLevelProperty(keyStr)) {
            if (keyStr === 'vectors' && typeof value === 'object' && value !== null) {
              // Ensure value matches the expected vectors type
              const vectors: Content['vectors'] = {}
              for (const vectorKey in value) {
                if (isVectorProperty(vectorKey) && typeof value[vectorKey] === 'string') {
                  vectors[vectorKey] = value[vectorKey]
                }
              }
              turn.message.content.vectors = vectors
            } else if (keyStr !== 'vectors' && typeof value === 'string') {
              (turn.message.content as any)[keyStr] = value
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
        streamingProperties: new Set(),
      }
    }
  }

  /**
   * Updates a turn in the database
   * @param {TurnUpdate} turn - Turn data to update
   * @returns {Promise<void>} Promise that resolves when the turn is updated
   * @throws {LMiXError} If the API request fails
   */
  async function updateTurn(turn: TurnUpdate): Promise<void> {
    loading.value = true
    error.value = null

    if (!turn.uuid) {
      throw new LMiXError(
        'Turn UUID is required',
        'TURN_UUID_REQUIRED',
      )
    }

    // Optimistically update turn in state
    const originalTurns = [...turns.value]

    turns.value = turns.value.map(t => {
      if (t.uuid === turn.uuid) {
        return {
          ...t,
          ...turn,
        }
      }
      return t
    })

    try {
      const client = useSupabaseClient<Database>()

      const { error: updateError } = await client
        .from('turns')
        .update(turn)
        .eq('uuid', turn.uuid)

      if (updateError) throw new LMiXError(
        updateError.message,
        'API_ERROR',
        updateError,
      )
    }
    catch (e) {
      turns.value = originalTurns
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turn update failed:', e)
      throw e
    }
    finally {
      loading.value = false
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

    // Get all child turns recursively
    const getAllChildTurnUuids = (turnUuid: string): string[] => {
      const childUuids = getChildTurnUuids.value(turn.production_uuid, turnUuid)
      return [
        ...childUuids,
        ...childUuids.flatMap(childUuid => getAllChildTurnUuids(childUuid))
      ]
    }

    // Get all child turns that need to be deleted
    const childTurnUuids = getAllChildTurnUuids(uuid)

    // Set active turn to null
    const originalActiveTurnUuid = getActiveTurnUuid.value(turn.production_uuid)
    setActiveTurn(turn.production_uuid, null)

    const originalTurns = [...turns.value]
    // Remove the parent turn and all child turns from the store
    turns.value = turns.value.filter(t => t.uuid !== uuid && !childTurnUuids.includes(t.uuid))

    try {
      const client = useSupabaseClient<Database>()

      // Supabase will handle cascade deletion of child turns
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
    loading,
    error,
    streamingState,
    // Getters
    getTurn,
    getProductionTurns,
    getActiveTurnUuid,
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
    updateTurn,
    deleteTurn,
  }
})

// Add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTurnStore, import.meta.hot))
}
