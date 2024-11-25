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
import type { Database } from '~/types/api'
import type { Assistant, Persona, Production, ProductionAssistant, ProductionInsert, ProductionPersona, ProductionRelation, ProductionWithRelations, Relation } from '~/types/app'
import { LMiXError } from '~/types/errors'

export const useProductionStore = defineStore('production', () => {
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
  const getProductionAssistants = computed(() => {
    return (productionUuid: string): string[] => productionAssistants.value
      .filter(pa => pa.production_uuid === productionUuid)
      .map(pa => pa.assistant_uuid)
  })

  /**
   * Returns the persona UUIDs associated with a production
   * @param {string} productionUuid - UUID of the production
   * @returns {string[]} Array of persona UUIDs
   */
  const getProductionPersonas = computed(() => {
    return (productionUuid: string): string[] => productionPersonas.value
      .filter(pp => pp.production_uuid === productionUuid)
      .map(pp => pp.persona_uuid)
  })

  /**
   * Returns the relation UUIDs associated with a production
   * @param {string} productionUuid - UUID of the production
   * @returns {string[]} Array of relation UUIDs
   */
  const getProductionRelations = computed(() => {
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
      const client = useSupabaseClient<Database>()
      const { data: selectedProductions, error: selectError } = await client
        .from('productions')
        .select('*')
        .order('created_at', { ascending: false })

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
      const client = useSupabaseClient<Database>()
      const { data: selectedProduction, error: selectError } = await client
        .from('productions')
        .select(`
          *,
          world:worlds (*),
          scenario:scenarios (*),
          production_assistants (*,
            assistant:assistants (*)
          ),
          production_personas (*,
            persona:personas (*)
          ),
          production_relations (*,
            relation:relations (
              *,
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
              created_at: string
              user_uuid: string
              persona: Persona | null
            }>
          })?.relation_personas

          return personas?.map(rp => ({
            relation_uuid: r.uuid,
            persona_uuid: rp.persona?.uuid ?? '',
            uuid: rp.uuid,
            created_at: rp.created_at,
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
          created_at: pa.created_at,
          production_uuid: uuid,
          assistant_uuid: pa.assistant?.uuid ?? '',
          user_uuid: pa.user_uuid
        })))
      }

      if (item.production_personas?.length) {
        productionPersonas.value.push(...item.production_personas.map(pp => ({
          uuid: pp.uuid,
          created_at: pp.created_at,
          production_uuid: uuid,
          persona_uuid: pp.persona?.uuid ?? '',
          user_uuid: pp.user_uuid
        })))
      }

      if (item.production_relations?.length) {
        productionRelations.value.push(...item.production_relations.map(pr => ({
          uuid: pr.uuid,
          created_at: pr.created_at,
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

    // Handle optimistic updates for core production data only
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
        created_at: new Date().toISOString(),
      } as Production)
    }

    try {
      const client = useSupabaseClient<Database>()

      // 1. Upsert core production data only
      const { data: upsertedProduction, error: upsertError } = await client
        .from('productions')
        .upsert({
          uuid: production.uuid,
          name: production.name,
          world_uuid: production.world_uuid,
          scenario_uuid: production.scenario_uuid,
        })
        .select()
        .single()

      if (upsertError) throw new LMiXError(
        upsertError.message,
        'API_ERROR',
        upsertError,
      )

      if (!upsertedProduction) throw new LMiXError(
        'No production data returned from upsert',
        'API_ERROR',
      )

      const productionUuid = upsertedProduction.uuid

      // 2. If updating, remove existing relations
      if (isUpdate) {
        const deletePromises = [
          client.from('production_assistants').delete().eq('production_uuid', productionUuid),
          client.from('production_personas').delete().eq('production_uuid', productionUuid),
          client.from('production_relations').delete().eq('production_uuid', productionUuid)
        ]

        const deleteResults = await Promise.all(deletePromises)

        deleteResults.forEach(({ error }) => {
          if (error) throw new LMiXError(
            error.message,
            'API_ERROR',
            error,
          )
        })
      }

      // 3. Insert new relations
      const now = new Date().toISOString()
      const insertPromises = []

      if (options.assistantUuids?.length) {
        const assistantRelations = options.assistantUuids.map(uuid => ({
          production_uuid: productionUuid,
          assistant_uuid: uuid,
          created_at: now
        }))
        insertPromises.push(
          client.from('production_assistants').insert(assistantRelations).select()
        )
      }

      if (options.personaUuids?.length) {
        const personaRelations = options.personaUuids.map(uuid => ({
          production_uuid: productionUuid,
          persona_uuid: uuid,
          created_at: now
        }))
        insertPromises.push(
          client.from('production_personas').insert(personaRelations).select()
        )
      }

      if (options.relationUuids?.length) {
        const relationRelations = options.relationUuids.map(uuid => ({
          production_uuid: productionUuid,
          relation_uuid: uuid,
          created_at: now
        }))
        insertPromises.push(
          client.from('production_relations').insert(relationRelations).select()
        )
      }

      const insertResults = await Promise.all(insertPromises)

      insertResults.forEach(({ error }) => {
        if (error) throw new LMiXError(
          error.message,
          'API_ERROR',
          error,
        )
      })

      // 4. Update store state
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

      // Update junction table states
      productionAssistants.value = productionAssistants.value.filter(pa => pa.production_uuid !== productionUuid)
      productionPersonas.value = productionPersonas.value.filter(pp => pp.production_uuid !== productionUuid)
      productionRelations.value = productionRelations.value.filter(pr => pr.production_uuid !== productionUuid)

      insertResults.forEach(({ data }) => {
        if (!data?.length) return

        // Check first item to determine the type of relation
        const firstItem = data[0]

        if ('assistant_uuid' in firstItem) {
          productionAssistants.value.push(...(data as ProductionAssistant[]))
        }
        else if ('persona_uuid' in firstItem) {
          productionPersonas.value.push(...(data as ProductionPersona[]))
        }
        else if ('relation_uuid' in firstItem) {
          productionRelations.value.push(...(data as ProductionRelation[]))
        }
      })

      return productionUuid
    }
    catch (e) {
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
      const client = useSupabaseClient<Database>()

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
    getProductionAssistants,
    getProductionPersonas,
    getProductionRelations,
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
