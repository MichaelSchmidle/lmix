/**
 * Store for managing relations between personas in the application.
 * Handles CRUD operations and state management for relations.
 * 
 * @remarks
 * Relations represent the connections between personas in the application.
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Database } from '~/types/api'
import type { Persona, Relation, RelationInsert, RelationPersona, RelationWithRelations } from '~/types/app'
import { LMiXError } from '~/types/errors'

export const useRelationStore = defineStore('relations', () => {
  const personaStore = usePersonaStore()
  const { getPersona } = storeToRefs(personaStore)

  // State
  const relations = ref<Relation[]>([])
  const relationPersonas = ref<RelationPersona[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a relation by UUID
   * @param {string} uuid - UUID of the relation to find
   * @returns {Relation | undefined} The relation object, or undefined if not found
   */
  const getRelation = computed(() => {
    return (uuid: string) => relations.value.find(r => r.uuid === uuid)
  })

  /**
   * Returns an array of persona UUIDs associated with a relation
   * @param {string} relationUuid - UUID of the relation
   * @returns {string[]} Array of persona UUIDs
   */
  const getRelationPersonas = computed(() => {
    return (relationUuid: string) => relationPersonas.value
      .filter(rp => rp.relation_uuid === relationUuid)
      .map(rp => rp.persona_uuid)
  })

  /**
   * Returns a formatted label for a relation, using either the relation name
   * or a concatenation of persona names as fallback
   * @param {string} relationUuid - UUID of the relation
   * @returns {string} Relation label
   */
  const getRelationLabel = computed(() => {
    return (relationUuid: string): string => {
      const relation = getRelation.value(relationUuid)

      // Return relation name if it exists
      if (relation?.name) {
        return relation.name
      }

      // Fall back to persona names concatenation
      const personaUuids = getRelationPersonas.value(relationUuid)
      return personaUuids
        .map(uuid => getPersona.value(uuid)?.name ?? 'Unknown')
        .sort((a, b) => a.localeCompare(b))
        .join(' · ')
    }
  })

  /**
   * Returns navigation links for relations, sorted alphabetically
   * @param {string[]} filterUuids Optional array of relation UUIDs to filter by
   * @param {string} icon Optional icon to use for navigation links
   * @returns {VerticalNavigationLink[]} Array of navigation links for either all relations or specified relations
   */
  const getRelationNavigation = computed(() => {
    return (filterUuids?: string[], icon?: string): VerticalNavigationLink[] => {
      if (filterUuids?.length === 0) return []

      const relationList = filterUuids
        ? relations.value.filter(r => filterUuids.includes(r.uuid))
        : relations.value

      return relationList
        .sort((a, b) => getRelationLabel.value(a.uuid).localeCompare(getRelationLabel.value(b.uuid)))
        .map((relation): VerticalNavigationLink => ({
          label: getRelationLabel.value(relation.uuid),
          to: `/relations/${relation.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for all relations, sorted alphabetically by name
   * @returns {Array<{ label: string; value: string }>} Array of select options
   */
  const getRelationOptions = computed(() => [
    ...relations.value
      .sort((a, b) => getRelationLabel.value(a.uuid).localeCompare(getRelationLabel.value(b.uuid)))
      .map(relation => ({
        label: getRelationLabel.value(relation.uuid),
        value: relation.uuid,
      })),
  ])

  /**
   * Returns relations associated with a specific persona
   * @param {string} personaUuid - UUID of the persona
   * @returns {Relation[]} Array of relations
   */
  const getRelationsByPersona = computed(() => {
    return (personaUuid: string) => {
      const relationUuids = relationPersonas.value
        .filter(rp => rp.persona_uuid === personaUuid)
        .map(rp => rp.relation_uuid)
      return relations.value.filter(r => relationUuids.includes(r.uuid))
    }
  })

  // Actions
  /**
   * Fetches all relations and their associated personas from the database if not already loaded
   * @returns {Promise<void>} Promise that resolves when the relations are fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectRelations(): Promise<void> {
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data: selectedRelations, error: selectError } = await client
        .from('relations')
        .select(`
          *,
          relation_personas (*)
        `)
        .order('created_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError,
      )

      relations.value = selectedRelations.map(({ relation_personas: _, ...relation }) => relation)
      relationPersonas.value = selectedRelations.flatMap(r => r.relation_personas || [])
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Relation selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
      fullyLoaded.value = true
    }
  }

  /**
   * Creates or updates a relation and its associated personas in the database
   * @param {RelationInsert} relation - The relation data to upsert
   * @param {string[]} personaUuids - Array of persona UUIDs to associate with the relation
   * @returns {Promise<string>} The UUID of the upserted relation
   * @throws {LMiXError} If the API request fails
   */
  async function upsertRelation(relation: RelationInsert, personaUuids: string[]): Promise<string> {
    loading.value = true
    error.value = null

    const isUpdate = !!relation.uuid
    const original = {
      relations: [...relations.value],
      relationPersonas: [...relationPersonas.value]
    }

    try {
      const client = useSupabaseClient<Database>()

      // First upsert the relation
      const { data: upsertedRelation, error: upsertError } = await client
        .from('relations')
        .upsert(relation)
        .select()
        .single()

      if (upsertError) throw new LMiXError(
        upsertError.message,
        'API_ERROR',
        upsertError,
      )

      if (!upsertedRelation) {
        throw new LMiXError(
          'No relation data returned from API',
          'API_ERROR',
        )
      }

      const relationUuid = upsertedRelation.uuid

      // Then handle the personas
      if (isUpdate) {
        // Delete existing relations
        const { error: deleteError } = await client
          .from('relation_personas')
          .delete()
          .eq('relation_uuid', relationUuid)

        if (deleteError) throw new LMiXError(
          deleteError.message,
          'API_ERROR',
          deleteError,
        )
      }

      // Insert new relations
      if (personaUuids.length) {
        const { data: insertedRelationPersonas, error: insertError } = await client
          .from('relation_personas')
          .insert(personaUuids.map(personaUuid => ({
            relation_uuid: relationUuid,
            persona_uuid: personaUuid,
          })))
          .select()

        if (insertError) throw new LMiXError(
          insertError.message,
          'API_ERROR',
          insertError,
        )

        relationPersonas.value = insertedRelationPersonas
      }

      if (isUpdate) {
        const index = relations.value.findIndex(r => r.uuid === relationUuid)
        if (index !== -1) {
          relations.value[index] = upsertedRelation
        }
      }
      else {
        relations.value.unshift(upsertedRelation)
      }

      return relationUuid
    }
    catch (e) {
      relations.value = original.relations
      relationPersonas.value = original.relationPersonas
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Relation upsert failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a relation and its associated personas from the database
   * @param {string} uuid - UUID of the relation to delete
   * @returns {Promise<void>} Promise that resolves when the relation is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteRelation(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = {
      relations: [...relations.value],
      relationPersonas: [...relationPersonas.value]
    }

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('relations')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
      )

      relations.value = relations.value.filter(r => r.uuid !== uuid)
      relationPersonas.value = relationPersonas.value.filter(rp => rp.relation_uuid !== uuid)
    }
    catch (e) {
      relations.value = original.relations
      relationPersonas.value = original.relationPersonas
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Relation deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Removes a persona from a relation in the database
   * @param {string} relationUuid - UUID of the relation
   * @param {string} personaUuid - UUID of the persona to remove
   * @returns {Promise<void>} Promise that resolves when the relation is updated
   * @throws {LMiXError} If the API request fails
   */
  async function removePersonaFromRelation(relationUuid: string, personaUuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...relationPersonas.value]

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('relation_personas')
        .delete()
        .match({
          relation_uuid: relationUuid,
          persona_uuid: personaUuid
        })

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
      )

      relationPersonas.value = relationPersonas.value.filter(
        rp => !(rp.relation_uuid === relationUuid && rp.persona_uuid === personaUuid)
      )
    }
    catch (e) {
      relationPersonas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Remove persona from relation failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Adds relations and their associated personas to the store
   * @param newRelations - The relations to add
   * @param newRelationPersonas - The personas associated with the relations
   */
  function addRelations(
    newRelations: (Relation | RelationWithRelations)[],
    newRelationPersonas: RelationPersona[] = []
  ) {
    const personaStore = usePersonaStore()

    // Extract and add personas from relation_personas if present
    const personas = newRelations
      .flatMap(r => (r as RelationWithRelations).relation_personas || [])
      .map(rp => rp.persona)
      .filter((p): p is Persona => p !== null)

    if (personas.length > 0) {
      personaStore.addPersonas(personas)
    }

    // Add relations
    const relationsToAdd = newRelations.filter(newRelation =>
      !relations.value.some(r => r.uuid === newRelation.uuid)
    )
    if (relationsToAdd.length > 0) {
      relations.value = [...relations.value, ...relationsToAdd]
    }

    // Add relation personas
    const relationPersonasToAdd = newRelationPersonas.filter(newRp =>
      !relationPersonas.value.some(rp =>
        rp.relation_uuid === newRp.relation_uuid &&
        rp.persona_uuid === newRp.persona_uuid
      )
    )
    if (relationPersonasToAdd.length > 0) {
      relationPersonas.value = [...relationPersonas.value, ...relationPersonasToAdd]
    }
  }

  return {
    // State
    relations,
    relationPersonas,
    loading,
    error,
    // Getters
    getRelation,
    getRelationPersonas,
    getRelationLabel,
    getRelationNavigation,
    getRelationOptions,
    getRelationsByPersona,
    // Actions
    selectRelations,
    upsertRelation,
    deleteRelation,
    removePersonaFromRelation,
    addRelations,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRelationStore, import.meta.hot))
}
