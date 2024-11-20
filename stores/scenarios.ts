/**
 * Store for managing scenarios in the application.
 * Handles CRUD operations and state management for scenarios.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Scenario, ScenarioInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useScenarioStore = defineStore('scenario', () => {
  // State
  const scenarios = ref<Scenario[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a scenario by UUID
   * @returns {(uuid: string) => Scenario | undefined} Function that takes a UUID and returns the matching scenario or undefined
   */
  const getScenario = computed(() => {
    return (uuid: string) => scenarios.value.find(s => s.uuid === uuid)
  })

  /**
   * Returns navigation links for scenarios, sorted alphabetically
   * @param filterUuids Optional array of scenario UUIDs to filter by
   * @param icon Optional icon to use for navigation links
   * @returns Array of navigation links for either all scenarios or specified scenarios
   */
  const getScenarioNavigation = computed(() => {
    return (filterUuids?: string[], icon?: string): VerticalNavigationLink[] => {
      if (filterUuids?.length === 0) return []

      const scenarioList = filterUuids
        ? scenarios.value.filter(s => filterUuids.includes(s.uuid))
        : scenarios.value

      return scenarioList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((scenario): VerticalNavigationLink => ({
          label: scenario.name,
          to: `/scenarios/${scenario.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for all scenarios, sorted alphabetically
   * @returns {Array<{label: string, value: string}>} Array of select options
   */
  const getScenarioOptions = computed(() => [
    ...scenarios.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(scenario => ({
        label: scenario.name,
        value: scenario.uuid,
      })),
  ])

  /**
   * Returns the total number of scenarios
   * @returns {number} Total count of scenarios
   */
  const getScenarioCount = computed(() => scenarios.value.length)

  // Actions
  /**
   * Fetches all scenarios from the database if not already loaded
   * @throws {LMiXError} If the API request fails
   */
  async function selectScenarios(): Promise<void> {
    if (scenarios.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('scenarios')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      scenarios.value = data
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Scenario selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a scenario in the database
   * @param {ScenarioInsert} scenario - The scenario data to upsert
   * @returns {Promise<string | null>} The UUID of the upserted scenario, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertScenario(scenario: ScenarioInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!scenario.uuid
    const original = [...scenarios.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = scenarios.value.findIndex(s => s.uuid === scenario.uuid)
      if (index !== -1) {
        scenarios.value[index] = { ...scenarios.value[index], ...scenario }
      }
    } else {
      tempId = crypto.randomUUID()
      scenarios.value.unshift({
        ...scenario,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as Scenario)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('scenarios')
        .upsert(scenario)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = scenarios.value.findIndex(s => s.uuid === data[0].uuid)
          if (index !== -1) {
            scenarios.value[index] = data[0]
          }
        } else if (tempId) {
          const tempIndex = scenarios.value.findIndex(s => s.uuid === tempId)
          if (tempIndex !== -1) {
            scenarios.value[tempIndex] = data[0]
          }
        }
        return data[0].uuid
      }

      return null
    }
    catch (e) {
      scenarios.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Scenario upsert failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a scenario from the database
   * @param {string} uuid - UUID of the scenario to delete
   * @throws {LMiXError} If the API request fails
   */
  async function deleteScenario(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...scenarios.value]
    scenarios.value = scenarios.value.filter(s => s.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('scenarios')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      scenarios.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Scenario deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Adds scenarios to the store
   * @param {Scenario[]} newScenarios - The new scenarios to add
   * @throws {LMiXError} If the API request fails
   */
  async function addScenarios(newScenarios: Scenario[]): Promise<void> {
    const scenariosToAdd = newScenarios.filter(newScenario =>
      !scenarios.value.some(s => s.uuid === newScenario.uuid)
    )
    if (scenariosToAdd.length > 0) {
      scenarios.value.push(...scenariosToAdd)
    }
  }

  return {
    // State
    scenarios,
    loading,
    error,
    // Getters
    getScenario,
    getScenarioNavigation,
    getScenarioOptions,
    getScenarioCount,
    // Actions
    selectScenarios,
    upsertScenario,
    deleteScenario,
    addScenarios,
  }
})