/**
 * Store for managing productions in the application.
 * Handles CRUD operations and state management for productions.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Production, ProductionInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useProductionStore = defineStore('production', () => {
  // State
  const productions = ref<Production[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a production by UUID
   * @returns {(uuid: string) => Production | undefined} Function that takes a UUID and returns the matching production or undefined
   */
  const getProduction = computed(() => {
    return (uuid: string) => productions.value.find(p => p.uuid === uuid)
  })

  /**
   * Returns navigation links for all productions, sorted alphabetically by name
   * @returns {VerticalNavigationLink[]} Array of navigation links
   */
  const getProductionNavigation = computed(() => {
    return productions.value
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      .map((production): VerticalNavigationLink => ({
        label: production.name ?? '',
        to: `/productions/${production.uuid}`,
      }))
  })

  /**
   * Returns the total number of productions
   * @returns {number} Total count of productions
   */
  const getProductionCount = computed(() => productions.value.length)

  // Actions
  /**
   * Fetches all productions from the database if not already loaded
   * Includes related world, scenario and assistant data
   * @throws {LMiXError} If the API request fails
   */
  async function selectProductions(): Promise<void> {
    if (productions.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('productions')
        .select(`
          *,
          world:worlds(*),
          scenario:scenarios(*),
          assistants:production_assistants(*)
        `)
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      productions.value = data
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Production selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a production in the database
   * @param {ProductionInsert} production - The production data to upsert
   * @returns {Promise<string | null>} The UUID of the upserted production, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertProduction(production: ProductionInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!production.uuid
    const original = [...productions.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = productions.value.findIndex(p => p.uuid === production.uuid)
      if (index !== -1) {
        productions.value[index] = { ...productions.value[index], ...production }
      }
    } else {
      tempId = crypto.randomUUID()
      productions.value.unshift({
        ...production,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as Production)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('productions')
        .upsert(production)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = productions.value.findIndex(p => p.uuid === data[0].uuid)
          if (index !== -1) {
            productions.value[index] = data[0]
          }
        } else if (tempId) {
          const tempIndex = productions.value.findIndex(p => p.uuid === tempId)
          if (tempIndex !== -1) {
            productions.value[tempIndex] = data[0]
          }
        }
        return data[0].uuid
      }

      return null
    }
    catch (e) {
      productions.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Production upsert failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a production from the database
   * @param {string} uuid - UUID of the production to delete
   * @throws {LMiXError} If the API request fails
   */
  async function deleteProduction(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...productions.value]
    productions.value = productions.value.filter(p => p.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('productions')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      productions.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Production deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    productions,
    loading,
    error,
    getProduction,
    getProductionNavigation,
    getProductionCount,
    selectProductions,
    upsertProduction,
    deleteProduction,
  }
}) 