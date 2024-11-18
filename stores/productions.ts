/**
 * Store for managing productions in the application.
 * Handles CRUD operations and state management for productions.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Production, ProductionInsert, ProductionWithRelations } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useProductionStore = defineStore('production', () => {
  // State
  const productions = ref<ProductionWithRelations[]>([])
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
   * Returns a formatted label for a production, using either the production name
   * or the creation date/time as fallback
   * @returns {(production: Production) => string} Function that returns formatted label
   */
  const getProductionLabel = computed(() => {
    return (production: Production) => {
      if (production.name) {
        return production.name
      }

      // Fall back to formatted creation date and time
      return new Date(production.created_at).toLocaleString()
    }
  })

  /**
   * Returns navigation links for all productions, sorted alphabetically by label
   * @returns {VerticalNavigationLink[]} Array of navigation links
   */
  const getProductionNavigation = computed(() => {
    return productions.value
      .sort((a, b) => getProductionLabel.value(a).localeCompare(getProductionLabel.value(b)))
      .map((production): VerticalNavigationLink => ({
        label: getProductionLabel.value(production),
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
   * Fetches all productions with their relationships from the database
   * Includes related world, scenario, assistants, personas, and relationships data
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
          production_assistants(
            uuid,
            assistant:assistants(*)
          ),
          production_personas(
            uuid,
            persona:personas(*)
          ),
          production_relationships(
            uuid,
            relationship:relationships(
              *,
              relationship_personas(
                uuid,
                persona:personas(*)
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .returns<ProductionWithRelations[]>()

      if (apiError) throw new LMiXError(apiError.message, 'API_ERROR', apiError)

      productions.value = data ?? []
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
   * Creates or updates a production with its relationships
   * @param {ProductionInsert} production - The production data to upsert
   * @param {Object} options - Additional options for related data
   * @param {string[]} options.assistantUuids - UUIDs of related assistants
   * @param {string[]} options.personaUuids - UUIDs of related personas
   * @param {string[]} options.relationshipUuids - UUIDs of related relationships
   */
  async function upsertProduction(
    production: ProductionInsert,
    options: {
      assistantUuids?: string[]
      personaUuids?: string[]
      relationshipUuids?: string[]
    } = {}
  ): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!production.uuid
    const original = [...productions.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = productions.value.findIndex(p => p.uuid === production.uuid)
      if (index !== -1) {
        productions.value[index] = {
          ...productions.value[index],
          ...production
        }
      }
    } else {
      tempId = crypto.randomUUID()
      // Create a temporary production with required relations
      productions.value.unshift({
        ...production,
        uuid: tempId,
        created_at: new Date().toISOString(),
        // Add required production_assistants array
        production_assistants: [],
        // Add optional relations as empty arrays
        production_personas: [],
        production_relationships: []
      } as ProductionWithRelations)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .rpc('upsert_production_with_relationships', {
          production_data: production,
          assistant_uuids: options.assistantUuids || [],
          persona_uuids: options.personaUuids || [],
          relationship_uuids: options.relationshipUuids || []
        })

      if (apiError) throw new LMiXError(apiError.message, 'API_ERROR', apiError)

      if (data?.[0]) {
        const updatedProduction = data[0] as ProductionWithRelations // Type the response
        if (isUpdate) {
          const index = productions.value.findIndex(p => p.uuid === updatedProduction.uuid)
          if (index !== -1) {
            productions.value[index] = updatedProduction
          }
        } else if (tempId) {
          const tempIndex = productions.value.findIndex(p => p.uuid === tempId)
          if (tempIndex !== -1) {
            productions.value[tempIndex] = updatedProduction
          }
        }
        return updatedProduction.uuid
      }

      return null
    }
    catch (e) {
      productions.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Production upsert failed:', e)
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
    getProductionLabel,
    getProductionNavigation,
    getProductionCount,
    selectProductions,
    upsertProduction,
    deleteProduction,
  }
}) 