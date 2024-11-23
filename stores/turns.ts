import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type {
  Turn,
  TurnInsert,
  ProductionPersonaEvolution,
  ProductionPersonaEvolutionInsert,
  UserTurnMessage,
  Persona,
  Message
} from '~/types/app'
import { LMiXError } from '~/types/errors'
import { useChat } from '@ai-sdk/vue'

export const useTurnStore = defineStore('turn', () => {
  // State
  const turns = ref<Turn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

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
    evolution?: ProductionPersonaEvolutionInsert
  ): Promise<string | null> {
    loading.value = true
    error.value = null
    const tempId = crypto.randomUUID()

    const original = {
      turns: [...turns.value],
      evolutions: [...evolutions.value]
    }

    // Optimistic update
    turns.value.push({
      ...turn,
      uuid: tempId,
      created_at: new Date().toISOString(),
      user_uuid: useSupabaseUser().value?.id || '',
      parent_turn_uuid: turn.parent_turn_uuid || null,
    })

    try {
      const client = useSupabaseClient<Database>()

      // Insert turn
      const { data: insertedTurn, error: turnError } = await client
        .from('turns')
        .insert(turn)
        .select()
        .single()

      if (turnError) throw new LMiXError(turnError.message, 'API_ERROR', turnError)
      if (!insertedTurn) return null

      // If evolution data is provided, insert it
      if (evolution) {
        const { error: evolutionError } = await client
          .from('production_persona_evolutions')
          .insert(evolution)
          .select()

        if (evolutionError) throw new LMiXError(evolutionError.message, 'API_ERROR', evolutionError)
      }

      // Update store with real data
      const tempIndex = turns.value.findIndex(t => t.uuid === tempId)
      if (tempIndex !== -1) {
        turns.value[tempIndex] = insertedTurn as Turn
      }

      return insertedTurn.uuid
    }
    catch (e) {
      // Rollback on failure
      turns.value = original.turns
      evolutions.value = original.evolutions
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turn creation failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function triggerTurn(message: UserTurnMessage): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Insert user message if applicable
      if (message.performance) {
        let persona: Persona | undefined

        if (message.sending_persona_uuid) {
          const personaStore = usePersonaStore()
          persona = personaStore.getPersona(message.sending_persona_uuid)
        }

        const turn: TurnInsert = {
          production_uuid: message.production_uuid,
          message: {
            content: {
              persona_name: persona?.name || 'User',
              performance: message.performance
            },
            role: 'user',
          },
        }

        if (message.sending_persona_uuid) {
          turn.message.metadata = { persona_uuid: message.sending_persona_uuid }
        }

        await insertTurn(turn)
      }
    }
    catch (err) {
      error.value = err as LMiXError
    }
    finally {
      loading.value = false
    }
  }

  async function persistAssistantResponse(production_uuid: string, content: string): Promise<void> {
    try {
      await insertTurn({
        production_uuid,
        message: {
          role: 'assistant',
          content: {
            persona: 'Assistant',
            performance: content
          }
        }
      })
    } catch (err) {
      error.value = err as LMiXError
    }
  }

  return {
    // State
    turns,
    evolutions,
    loading,
    error,
    // Getters
    getTurn,
    getProductionTurns,
    getPersonaEvolutions,
    // Actions
    selectTurns,
    insertTurn,
    triggerTurn,
    persistAssistantResponse
  }
})