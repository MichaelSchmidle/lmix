/**
 * Store for managing productions in the application.
 * Handles CRUD operations and state management for productions.
 * 
 * @remarks
 * Productions are the main containers that bring together all components:
 * - World: Global conditions
 * - Scenario: Starting context
 * - Assistants: AI participants
 * - Personas: User participants
 * - Relations: Connections between participants
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Assistant, Persona, Production, ProductionAssistant, ProductionInsert, ProductionPersona, ProductionRelation, ProductionWithRelations, Relation } from '~/types/app'
import { LMiXError, ApiError } from '~/types/errors'

export const useProductionStore = defineStore('production', () => {
  // Reset state
  function $reset() {
    productions.value = []
    productionAssistants.value = []
    productionPersonas.value = []
    productionRelations.value = []
    fullyLoaded.value = false
    loading.value = false
    error.value = null
  }

  // State
  const productions = ref<Production[]>([])
  const productionAssistants = ref<ProductionAssistant[]>([])
  const productionPersonas = ref<ProductionPersona[]>([])
  const productionRelations = ref<ProductionRelation[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a production by UUID
   * @param {string} uuid - UUID of the production
   * @returns {Production | undefined} Production object or undefined
   */
  const getProduction = computed(() => {
    return (uuid: string): Production | undefined => productions.value.find(p => p.uuid === uuid)
  })

  /**
   * Returns the assistant UUIDs associated with a production
   * @param {string} productionUuid - UUID of the production
   * @returns {string[]} Array of assistant UUIDs
   */
  const getProductionAssistantUuids = computed(() => {
    return (productionUuid: string): string[] => productionAssistants.value
      .filter(pa => pa.production_uuid === productionUuid)
      .map(pa => pa.assistant_uuid)
  })

  /**
   * Returns the persona UUIDs associated with a production
   * @param {string} productionUuid - UUID of the production
   * @returns {string[]} Array of persona UUIDs
   */
  const getProductionPersonaUuids = computed(() => {
    return (productionUuid: string): string[] => productionPersonas.value
      .filter(pp => pp.production_uuid === productionUuid)
      .map(pp => pp.persona_uuid)
  })

  /**
   * Returns the relation UUIDs associated with a production
   * @param {string} productionUuid - UUID of the production
   * @returns {string[]} Array of relation UUIDs
   */
  const getProductionRelationUuids = computed(() => {
    return (productionUuid: string): string[] => productionRelations.value
      .filter(pr => pr.production_uuid === productionUuid)
      .map(pr => pr.relation_uuid)
  })

  /**
   * Returns a formatted label for a production, using either the production name
   * or the creation date/time as fallback
   * @param {Production} production - Production object
   * @returns {string} Production label
   */
  const getProductionLabel = computed(() => {
    return (production: Production): string => {
      if (production.name) {
        return production.name
      }

      // Fall back to formatted creation date and time
      return new Date(production.inserted_at).toLocaleString()
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
   * Fetches basic production data for all productions
   * Used for navigation and overview purposes
   * @returns {Promise<void>} Promise that resolves when the productions are fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectProductions(): Promise<void> {
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient()
      const { data: selectedProductions, error: selectError } = await client
        .from('productions')
        .select('*')
        .order('inserted_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError,
      )

      if (!selectedProductions) return

      productions.value = selectedProductions
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Productions fetch failed:', e)
      throw e
    }
    finally {
      loading.value = false
      fullyLoaded.value = true
    }
  }

  /**
   * Fetches detailed production data including all relations
   * @param {string} uuid - UUID of the production to fetch
   * @returns {Promise<void>} Promise that resolves when the production is fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectProduction(uuid: string): Promise<void> {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient()
      const { data: selectedProduction, error: selectError } = await client
        .from('productions')
        .select(`
          *,
          world:worlds (*),
          scenario:scenarios (*),
          production_assistants (*,
            assistant:assistants (*,
              persona:personas (*)
              )
          ),
          production_personas (*,
            persona:personas (*)
          ),
          production_relations (*,
            relation:relations (*,
              relation_personas (*,
                persona:personas (*)
              )
            )
          )
        `)
        .eq('uuid', uuid)
        .single()

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError,
      )

      if (!selectedProduction) {
        throw new LMiXError(
          `Production with UUID ${uuid} not found`,
          'NOT_FOUND',
        )
      }

      const item = selectedProduction as ProductionWithRelations

      // Update related stores
      const worldStore = useWorldStore()
      const scenarioStore = useScenarioStore()
      const assistantStore = useAssistantStore()
      const personaStore = usePersonaStore()
      const relationStore = useRelationStore()

      if (item.world) {
        worldStore.addWorlds([item.world])
      }

      if (item.scenario) {
        scenarioStore.addScenarios([item.scenario])
      }

      const assistants = item.production_assistants
        ?.map(pa => pa.assistant)
        .filter((a): a is Assistant => a !== null)

      if (assistants?.length) {
        assistantStore.addAssistants(assistants)
      }

      const personas = item.production_personas
        ?.map(pp => pp.persona)
        .filter((p): p is Persona => p !== null)

      if (personas?.length) {
        personaStore.addPersonas(personas)
      }

      const relations = item.production_relations
        ?.map(pr => pr.relation)
        .filter((r): r is Relation => r !== null)

      if (relations?.length) {
        const relationPersonas = relations.flatMap(r => {
          const personas = (r as Relation & {
            relation_personas?: Array<{
              uuid: string
              inserted_at: string
              user_uuid: string
              persona: Persona | null
            }>
          })?.relation_personas

          return personas?.map(rp => ({
            relation_uuid: r.uuid,
            persona_uuid: rp.persona?.uuid ?? '',
            uuid: rp.uuid,
            inserted_at: rp.inserted_at,
            user_uuid: rp.user_uuid
          })) ?? []
        }).filter(rp => rp.persona_uuid)

        relationStore.addRelations(relations, relationPersonas)
      }

      // Update production in store if it exists, otherwise add it
      const index = productions.value.findIndex(p => p.uuid === uuid)
      const { production_assistants, production_personas, production_relations, world, scenario, ...production } = item

      if (index !== -1) {
        productions.value[index] = production
      }
      else {
        productions.value.push(production)
      }

      // Update relations
      productionAssistants.value = productionAssistants.value.filter(
        pa => pa.production_uuid !== uuid
      )
      productionPersonas.value = productionPersonas.value.filter(
        pp => pp.production_uuid !== uuid
      )
      productionRelations.value = productionRelations.value.filter(
        pr => pr.production_uuid !== uuid
      )

      // Add new relations
      if (item.production_assistants?.length) {
        productionAssistants.value.push(...item.production_assistants.map(pa => ({
          uuid: pa.uuid,
          inserted_at: pa.inserted_at,
          production_uuid: uuid,
          assistant_uuid: pa.assistant?.uuid ?? '',
          user_uuid: pa.user_uuid
        })))
      }

      if (item.production_personas?.length) {
        productionPersonas.value.push(...item.production_personas.map(pp => ({
          uuid: pp.uuid,
          inserted_at: pp.inserted_at,
          production_uuid: uuid,
          persona_uuid: pp.persona?.uuid ?? '',
          user_uuid: pp.user_uuid
        })))
      }

      if (item.production_relations?.length) {
        productionRelations.value.push(...item.production_relations.map(pr => ({
          uuid: pr.uuid,
          inserted_at: pr.inserted_at,
          production_uuid: uuid,
          relation_uuid: pr.relation?.uuid ?? '',
          user_uuid: pr.user_uuid
        })))
      }
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Production fetch failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a production with its relations
   * @param {ProductionInsert} production - The production data to upsert
   * @param {object} options - Additional options for related data
   * @param {string[]} options.assistantUuids - UUIDs of related assistants
   * @param {string[]} options.personaUuids - UUIDs of related personas
   * @param {string[]} options.relationUuids - UUIDs of related relations
   * @returns {Promise<string>} Promise resolving to the UUID of the created/updated production
   * @throws {LMiXError} If the API request fails
   */
  async function upsertProduction(
    production: ProductionInsert,
    options: {
      assistantUuids?: string[]
      personaUuids?: string[]
      relationUuids?: string[]
    } = {}
  ): Promise<string> {
    loading.value = true
    error.value = null
    const isUpdate = !!production.uuid

    const original = {
      productions: [...productions.value],
      productionAssistants: [...productionAssistants.value],
      productionPersonas: [...productionPersonas.value],
      productionRelations: [...productionRelations.value]
    }

    let tempId: string | null = null

    // Optimistic update for production
    if (isUpdate) {
      const index = productions.value.findIndex(p => p.uuid === production.uuid)
      if (index !== -1) {
        productions.value[index] = { ...productions.value[index], ...production }
      }
    }
    else {
      tempId = crypto.randomUUID()
      productions.value.unshift({
        ...production,
        uuid: tempId,
        inserted_at: new Date().toISOString(),
      } as Production)
    }

    try {
      const client = useSupabaseClient()

      // 1. Upsert core production data
      const { data: upsertedProduction, error: upsertError } = await client
        .from('productions')
        .upsert(production, {
          onConflict: 'uuid',
        })
        .select()
        .single()

      if (upsertError) {
        throw new ApiError(
          upsertError.message,
          upsertError
        )
      }

      if (!upsertedProduction) {
        throw new ApiError(
          'No production data returned from API'
        )
      }

      const productionUuid = upsertedProduction.uuid

      // 2. Always clear existing relations when updating
      if (isUpdate) {
        const deletePromises = []

        if (Array.isArray(options.assistantUuids) && options.assistantUuids.length === 0) {
          deletePromises.push(client.from('production_assistants').delete().eq('production_uuid', productionUuid))
        }
        if (Array.isArray(options.personaUuids) && options.personaUuids.length === 0) {
          deletePromises.push(client.from('production_personas').delete().eq('production_uuid', productionUuid))
        }
        if (Array.isArray(options.relationUuids) && options.relationUuids.length === 0) {
          deletePromises.push(client.from('production_relations').delete().eq('production_uuid', productionUuid))
        }

        if (deletePromises.length > 0) {
          const deleteResults = await Promise.all(deletePromises)

          deleteResults.forEach(({ error }) => {
            if (error) {
              throw new ApiError(
                'Failed to delete existing production relations',
                error
              )
            }
          })

          // Optimistically clear relations in state
          productionAssistants.value = productionAssistants.value.filter(pa => pa.production_uuid !== productionUuid)
          productionPersonas.value = productionPersonas.value.filter(pp => pp.production_uuid !== productionUuid)
          productionRelations.value = productionRelations.value.filter(pr => pr.production_uuid !== productionUuid)
        }

        // 3. Insert new relations
        const now = new Date().toISOString()
        const upsertPromises = []

        if (options.assistantUuids?.length) {
          const assistantRelations = options.assistantUuids.map(uuid => ({
            uuid: crypto.randomUUID(),
            user_uuid: useSupabaseUser().value?.id!,
            production_uuid: productionUuid,
            assistant_uuid: uuid,
            inserted_at: now,
          }))
          upsertPromises.push(
            client
              .from('production_assistants')
              .upsert(assistantRelations, {
                onConflict: 'production_uuid,assistant_uuid',
                ignoreDuplicates: true
              })
              .select()
          )

          // Optimistic update for assistants
          productionAssistants.value.push(...assistantRelations)
        }

        if (options.personaUuids?.length) {
          const personaRelations = options.personaUuids.map(uuid => ({
            uuid: crypto.randomUUID(),
            user_uuid: useSupabaseUser().value?.id!,
            production_uuid: productionUuid,
            persona_uuid: uuid,
            inserted_at: now,
          }))
          upsertPromises.push(
            client
              .from('production_personas')
              .upsert(personaRelations, {
                onConflict: 'production_uuid,persona_uuid',
                ignoreDuplicates: true
              })
              .select()
          )

          // Optimistic update for personas
          productionPersonas.value.push(...personaRelations)
        }

        if (options.relationUuids?.length) {
          const relationRelations = options.relationUuids.map(uuid => ({
            uuid: crypto.randomUUID(),
            user_uuid: useSupabaseUser().value?.id!,
            production_uuid: productionUuid,
            relation_uuid: uuid,
            inserted_at: now,
          }))
          upsertPromises.push(
            client
              .from('production_relations')
              .upsert(relationRelations, {
                onConflict: 'production_uuid,relation_uuid',
                ignoreDuplicates: true
              })
              .select()
          )

          // Optimistic update for relations
          productionRelations.value.push(...relationRelations)
        }

        const upsertResults = await Promise.all(upsertPromises)

        upsertResults.forEach(({ error }) => {
          if (error) {
            throw new ApiError(
              'Failed to insert production relations',
              error
            )
          }
        })

        // Update production in state with actual data from server
        if (isUpdate) {
          const index = productions.value.findIndex(p => p.uuid === productionUuid)
          if (index !== -1) {
            productions.value[index] = upsertedProduction
          }
        }
        else if (tempId) {
          const tempIndex = productions.value.findIndex(p => p.uuid === tempId)
          if (tempIndex !== -1) {
            productions.value[tempIndex] = upsertedProduction
          }
        }
      }

      return productionUuid
    }
    catch (e) {
      // Rollback all original state
      productions.value = original.productions
      productionAssistants.value = original.productionAssistants
      productionPersonas.value = original.productionPersonas
      productionRelations.value = original.productionRelations
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Production upsert failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a production and all its relations from the database
   * @param {string} uuid - UUID of the production to delete
   * @returns {Promise<void>} Promise that resolves when the production is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteProduction(uuid: string): Promise<void> {
    loading.value = true
    error.value = null
    const original = [...productions.value]
    productions.value = productions.value.filter(p => p.uuid !== uuid)

    try {
      const client = useSupabaseClient()

      const { error: deleteError } = await client
        .from('productions')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
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
    $reset,
    // State
    productions,
    productionAssistants,
    productionPersonas,
    productionRelations,
    loading,
    error,
    // Getters
    getProduction,
    getProductionLabel,
    getProductionNavigation,
    getProductionCount,
    getProductionAssistantUuids,
    getProductionPersonaUuids,
    getProductionRelationUuids,
    // Actions
    selectProductions,
    selectProduction,
    upsertProduction,
    deleteProduction,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductionStore, import.meta.hot))
}
