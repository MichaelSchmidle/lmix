import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Turn, TurnInsert, ProductionPersonaEvolution, ProductionPersonaEvolutionInsert, UserTurnMessage, Content, Message } from '~/types/app'
import { LMiXError } from '~/types/errors'

// Streaming state types
interface StreamingState {
  isStreaming: boolean
  currentPhase: 'performing' | 'vectorizing' | 'evolving' | 'commenting' | null
  error: string | null
}

export const useTurnStore = defineStore('turn', () => {
  // State
  const turns = ref<Turn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const streamingState = ref<StreamingState>({
    isStreaming: false,
    currentPhase: null,
    error: null
  })

  // Getters
  const getTurn = computed(() => {
    return (uuid: string) => turns.value.find(t => t.uuid === uuid)
  })

  const getProductionTurns = computed(() => {
    return (productionUuid: string) => turns.value
      .filter(t => t.production_uuid === productionUuid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  const getPersonaEvolutions = computed(() => {
    return (productionUuid: string, personaUuid: string) => evolutions.value
      .filter(e =>
        e.production_uuid === productionUuid &&
        e.persona_uuid === personaUuid
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  // Actions
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

      if (turnsResult.error) throw new LMiXError(turnsResult.error.message, 'API_ERROR', turnsResult.error)
      if (evolutionsResult.error) throw new LMiXError(evolutionsResult.error.message, 'API_ERROR', evolutionsResult.error)

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

  async function insertTurn(
    turn: TurnInsert,
  ): Promise<string | null> {
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

      if (insertedTurnError) throw new LMiXError(insertedTurnError.message, 'API_ERROR', insertedTurnError)

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

  async function triggerTurn(message: UserTurnMessage) {
    streamingState.value = {
      isStreaming: true,
      currentPhase: null,
      error: null
    }

    try {
      const userTurnUuid = ref<string | null>(null)

      // First, persist the user's message if applicable (i.e., if performance is provided)
      if (message.performance) {
        const userTurn: TurnInsert = {
          production_uuid: message.production_uuid,
          message: {
            role: 'user',
            content: {
              persona_name: message.sending_persona_uuid
                ? usePersonaStore().getPersona(message.sending_persona_uuid)?.name || 'User'
                : 'User',
              performance: message.performance
            },
            metadata: message.sending_persona_uuid
              ? { persona_uuid: message.sending_persona_uuid }
              : undefined
          }
        }

        userTurnUuid.value = await insertTurn(userTurn)
      }
    }
    catch (e) {
      streamingState.value.error = e instanceof Error ? e.message : 'An error occurred'
      if (import.meta.dev) console.error('User turn creation failed:', e)
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
    // Getters
    getTurn,
    getProductionTurns,
    getPersonaEvolutions,
    // Actions
    selectTurns,
    insertTurn,
    triggerTurn,
  }
})