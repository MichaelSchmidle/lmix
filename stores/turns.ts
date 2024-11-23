import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type {
  Turn,
  TurnInsert,
  ProductionPersonaEvolution,
  ProductionPersonaEvolutionInsert,
  UserTurnMessage
} from '~/types/app'
import { LMiXError } from '~/types/errors'

export const useTurnStore = defineStore('turn', () => {
  // State
  const turns = ref<Turn[]>([])
  const evolutions = ref<ProductionPersonaEvolution[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const inferenceStream = ref<ReadableStream | null>(null)
  const currentStreamingTurn = ref<Turn | null>(null)

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

    // Format message properly
    const formattedTurn = {
      ...turn,
      message: typeof turn.message === 'string'
        ? { content: turn.message, metadata: {} }
        : turn.message
    }

    // Optimistic update
    turns.value.push({
      ...formattedTurn,
      uuid: tempId,
      created_at: new Date().toISOString()
    } as Turn)

    try {
      const client = useSupabaseClient<Database>()

      // Insert turn
      const { data: turnData, error: turnError } = await client
        .from('turns')
        .insert(formattedTurn)
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

  async function triggerTurn(message: UserTurnMessage & { production_uuid: string }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Get user info
      const client = useSupabaseClient<Database>()
      const user = useSupabaseUser()

      // If message has content, store it first
      if (message.content?.trim()) {
        // Get persona name if persona_uuid is provided
        let senderPersonaName = 'User' // Default
        if (message.persona_uuid) {
          const { data: persona } = await client
            .from('personas')
            .select('name')
            .eq('uuid', message.persona_uuid)
            .single()

          if (persona) {
            senderPersonaName = persona.name
          }
        }

        await insertTurn({
          message: message.content,
          production_uuid: message.production_uuid,
          sender_persona_name: senderPersonaName,
          user_uuid: user.value?.id || '',
          parent_turn_uuid: null // TODO: Implement turn threading if needed
        })
      }

      // Initialize streaming turn in Pinia
      const streamingTurn: Turn = {
        uuid: crypto.randomUUID(),
        message: { content: '', metadata: {} },
        production_uuid: message.production_uuid,
        sender_persona_name: 'Assistant',
        user_uuid: user.value?.id || '',
        parent_turn_uuid: null,
        created_at: new Date().toISOString(),
      }

      // Add turn to state and set as streaming
      turns.value = [...turns.value, streamingTurn]
      currentStreamingTurn.value = streamingTurn

      // Trigger inference and handle streaming
      const response = await $fetch('/api/turns', {
        method: 'POST',
        body: message
      })

      // Process the stream
      if (response.body) {
        const reader = (response.body as ReadableStream).getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            
            // Update the streaming turn in the array
            const index = turns.value.findIndex(t => t.uuid === streamingTurn.uuid)
            if (index !== -1) {
              const turn = turns.value[index]
              const message = turn.message as { content: string, metadata: Record<string, unknown> }
              message.content += chunk
              // Force reactivity update
              turns.value = [...turns.value]
            }
          }
        } finally {
          // Fetch the final persisted turn from Supabase
          await selectTurns(message.production_uuid)
        }
      }

    } catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Turn trigger failed:', e)
      throw e
    } finally {
      loading.value = false
      currentStreamingTurn.value = null
    }
  }

  return {
    // State
    turns,
    evolutions,
    loading,
    error,
    inferenceStream,
    currentStreamingTurn,
    // Getters
    getTurn,
    getProductionTurns,
    getPersonaEvolutions,
    // Actions
    selectTurns,
    insertTurn,
    triggerTurn
  }
})