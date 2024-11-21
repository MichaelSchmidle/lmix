import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type {
  Turn,
  TurnInsert,
  ProductionPersonaEvolution,
  ProductionPersonaEvolutionInsert
} from '~/types/app'
import { LMiXError } from '~/types/errors'

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

      turns.value = turnsResult.data || []
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

  async function createTurn(
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
      created_at: new Date().toISOString()
    } as Turn)

    try {
      const client = useSupabaseClient<Database>()

      // Insert turn
      const { data: turnData, error: turnError } = await client
        .from('turns')
        .insert(turn)
        .select()
        .single()

      if (turnError) throw new LMiXError(turnError.message, 'API_ERROR', turnError)
      if (!turnData) return null

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
        turns.value[tempIndex] = turnData
      }

      return turnData.uuid
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
    createTurn
  }
}) 