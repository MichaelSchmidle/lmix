import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Turn, TurnInsert, ProductionPersonaEvolution, UserTurnMessage, Content } from '~/types/app'
import { LMiXError } from '~/types/errors'
import { JSONParser } from '@streamparser/json'

// Streaming state types
interface StreamingState {
  isStreaming: boolean
  currentPhase: 'performing' | 'vectorizing' | 'evolving' | 'commenting' | null
  error: string | null
}

// Define interface for parser callback
interface ParsedElement {
  value: unknown
  key?: string | number
  parent?: unknown
  stack?: unknown[]
  partial?: boolean
}

export const useTurnStore = defineStore('turn', () => {
  // State
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

  const getStreamingTurn = computed(() => {
    if (!streamingTurn.value || Object.keys(streamingTurn.value).length === 0) {
      return null
    }
    return {
      message: {
        role: 'assistant',
        content: streamingTurn.value
      }
    }
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

      // Call the API to trigger assistant turn
      const messages = message.performance ? [{
        role: 'user',
        content: JSON.stringify({
          performance: message.performance,
          persona_name: message.sending_persona_uuid
            ? usePersonaStore().getPersona(message.sending_persona_uuid)?.name || 'User'
            : 'User',
        }),
      }] : []

      const response = await fetch('/api/turns', {
        method: 'POST',
        body: JSON.stringify({
          messages,
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
          emitPartialValues: true
        })

        // Handle parser errors
        parser.onError = (error) => {
          throw new LMiXError(
            'Failed to parse streaming response',
            'STREAM_PARSE_ERROR',
            error
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
              if (import.meta.dev) {
                console.debug(`Stream update (${partial ? 'partial' : 'complete'}):`, key, value)
              }
            }
          } else if (path.length === 2 && path[0] === 'vectors' && isVectorProperty(key)) {
            // Nested properties under 'vectors'
            if (typeof value === 'string') {
              if (!streamingTurnValue.vectors) {
                streamingTurnValue.vectors = {
                  location: undefined,
                  posture: undefined,
                  direction: undefined,
                  momentum: undefined
                }
              }
              (streamingTurnValue.vectors as any)[key] = value
              streamingTurn.value = { ...streamingTurnValue }
              if (import.meta.dev) {
                console.debug(`Stream update (${partial ? 'partial' : 'complete'}): vectors.${key}`, value)
              }
            }
          } else if (path.length === 2 && path[0] === 'evolution' && isEvolutionProperty(key)) {
            // Nested properties under 'evolution'
            if (typeof value === 'string') {
              if (!streamingTurnValue.evolution) {
                streamingTurnValue.evolution = {
                  self_perception: undefined,
                  private_knowledge: undefined,
                  note_to_future_self: undefined
                }
              }
              (streamingTurnValue.evolution as any)[key] = value
              streamingTurn.value = { ...streamingTurnValue }
              if (import.meta.dev) {
                console.debug(`Stream update (${partial ? 'partial' : 'complete'}): evolution.${key}`, value)
              }
            }
          }
        }

        // Process the stream
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          if (import.meta.dev) {
            console.debug('Stream chunk:', chunk)
          }
          
          parser.write(chunk)
        }

        streamingState.value.isStreaming = false
      }
      catch (e) {
        streamingState.value.error = e instanceof LMiXError 
          ? e.message 
          : 'Failed to process streaming response'
        
        if (import.meta.dev) {
          console.error('Turn streaming failed:', e)
        }
        
        throw e instanceof LMiXError 
          ? e 
          : new LMiXError(
              'Failed to process streaming response',
              'STREAM_ERROR',
              e
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

// Type guard to check if a string is a valid Content property
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
