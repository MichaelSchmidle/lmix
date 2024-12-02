/**
 * Store for managing scenarios in the application.
 * Handles CRUD operations and state management for scenarios.
 * 
 * @remarks
 * Scenarios represent the settings and rules for a production.
 */
import { defineStore } from 'pinia'
import type { Scenario, ScenarioInsert } from '~/types/app'
import { LMiXError, ApiError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useScenarioStore = defineStore('scenario', () => {
  // Reset state
  function $reset() {
    scenarios.value = []
    fullyLoaded.value = false
    loading.value = false
    error.value = null
  }

  // State
  const scenarios = ref<Scenario[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a scenario by UUID
   * @param {string} uuid - UUID of the scenario
   * @returns {Scenario | undefined} The scenario if found, undefined otherwise
   */
  const getScenario = computed(() => {
    return (uuid: string) => scenarios.value.find(s => s.uuid === uuid)
  })

  /**
   * Returns navigation links for scenarios, sorted alphabetically
   * @param {string[]} filterUuids Optional array of scenario UUIDs to filter by
   * @param {string} icon Optional icon to use for navigation links
   * @returns {VerticalNavigationLink[]} Array of navigation links for either all scenarios or specified scenarios
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
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient()

      const { data, error: selectError } = await client
        .from('scenarios')
        .select()
        .order('inserted_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError,
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
      fullyLoaded.value = true
    }
  }

  /**
   * Creates or updates a scenario in the database
   * @param {ScenarioInsert} scenario - The scenario data to upsert
   * @returns {Promise<string>} The UUID of the upserted scenario
   * @throws {LMiXError} If the API request fails
   */
  async function upsertScenario(scenario: ScenarioInsert): Promise<string> {
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
    }
    else {
      tempId = crypto.randomUUID()
      scenarios.value.unshift({
        ...scenario,
        uuid: tempId,
        inserted_at: new Date().toISOString(),
      } as Scenario)
    }

    try {
      const client = useSupabaseClient()

      const { data: selectedScenario, error: selectError } = await client
        .from('scenarios')
        .upsert(scenario)
        .select()
        .single()

      if (selectError) {
        throw new ApiError(
          selectError.message,
          selectError
        )
      }

      if (!selectedScenario) {
        throw new ApiError(
          'No scenario data returned from API'
        )
      }

      if (isUpdate) {
        const index = scenarios.value.findIndex(s => s.uuid === selectedScenario.uuid)
        if (index !== -1) {
          scenarios.value[index] = selectedScenario
        }
      }
      else if (tempId) {
        const tempIndex = scenarios.value.findIndex(s => s.uuid === tempId)
        if (tempIndex !== -1) {
          scenarios.value[tempIndex] = selectedScenario
        }
      }

      return selectedScenario.uuid
    }
    catch (e) {
      // Rollback optimistic update
      scenarios.value = original

      // Set error state for UI feedback
      error.value = e as LMiXError

      // Log in development only
      if (import.meta.dev) {
        console.error('Scenario upsert failed:', e)
      }

      // Re-throw for UI handling
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a scenario from the database
   * @param {string} uuid - UUID of the scenario to delete
   * @returns {Promise<void>} Promise that resolves when the scenario is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteScenario(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...scenarios.value]
    scenarios.value = scenarios.value.filter(s => s.uuid !== uuid)

    try {
      const client = useSupabaseClient()

      const { error: deleteError } = await client
        .from('scenarios')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
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
 * Adds scenarios to the store without inserting them into the database
 * @param {Scenario[]} newScenarios - The new scenarios to add
 */
  function addScenarios(newScenarios: Scenario[]): void {
    const scenariosToAdd = newScenarios.filter(newScenario =>
      !scenarios.value.some(s => s.uuid === newScenario.uuid)
    )

    if (scenariosToAdd.length > 0) {
      scenarios.value.push(...scenariosToAdd)
    }
  }

  return {
    $reset,
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScenarioStore, import.meta.hot))
}