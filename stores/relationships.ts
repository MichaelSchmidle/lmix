/**
 * Store for managing relationships between personas in the application.
 * Handles CRUD operations and state management for relationships.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Relationship, RelationshipInsert, RelationshipPersona } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useRelationshipStore = defineStore('relationship', () => {
  const personaStore = usePersonaStore()
  const { getPersona } = storeToRefs(personaStore)

  // State
  const relationships = ref<Relationship[]>([])
  const relationshipPersonas = ref<RelationshipPersona[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a relationship by UUID
   * @returns {(uuid: string) => Relationship | undefined} Function that takes a UUID and returns the matching relationship or undefined
   */
  const getRelationship = computed(() => {
    return (uuid: string) => relationships.value.find(r => r.uuid === uuid)
  })

  /**
   * Returns an array of persona UUIDs associated with a relationship
   * @returns {(relationshipUuid: string) => string[]} Function that takes a relationship UUID and returns array of persona UUIDs
   */
  const getRelationshipPersonas = computed(() => {
    return (relationshipUuid: string) => relationshipPersonas.value
      .filter(rp => rp.relationship_uuid === relationshipUuid)
      .map(rp => rp.persona_uuid)
  })

  /**
   * Returns a formatted label for a relationship, using either the relationship name
   * or a concatenation of persona names as fallback
   * @returns {(relationshipUuid: string) => string} Function that takes a relationship UUID and returns formatted label
   */
  const getRelationshipLabel = computed(() => {
    return (relationshipUuid: string) => {
      const relationship = getRelationship.value(relationshipUuid)

      // Return relationship name if it exists
      if (relationship?.name) {
        return relationship.name
      }

      // Fall back to persona names concatenation
      const personaUuids = getRelationshipPersonas.value(relationshipUuid)
      return personaUuids
        .map(uuid => getPersona.value(uuid)?.name ?? 'Unknown')
        .sort((a, b) => a.localeCompare(b))
        .join(' · ')
    }
  })

  /**
   * Returns navigation links for relationships, sorted alphabetically
   * @param filterRelationships Optional array of relationships to filter by
   * @param icon Optional icon to use for navigation links
   * @returns Array of navigation links for either all relationships or specified relationships
   */
  const getRelationshipNavigation = computed(() => {
    return (filterRelationships?: {
      uuid: string;
      relationship: {
        created_at: string;
        name: string | null;
        private_description: string | null;
        public_description: string | null;
        user_uuid: string;
        uuid: string;
        relationship_personas?: {
          [key: string]: any;
        }[] | undefined;
      };
    }[], icon?: string) => {
      const relationshipList = filterRelationships
        ? filterRelationships.map(r => r.relationship)
        : relationships.value

      return relationshipList
        .sort((a, b) => getRelationshipLabel.value(a.uuid).localeCompare(getRelationshipLabel.value(b.uuid)))
        .map((relationship): VerticalNavigationLink => ({
          label: getRelationshipLabel.value(relationship.uuid),
          to: `/relationships/${relationship.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for all relationships, sorted alphabetically by name
   */
  const getRelationshipOptions = computed(() => [
    ...relationships.value
      .sort((a, b) => getRelationshipLabel.value(a.uuid).localeCompare(getRelationshipLabel.value(b.uuid)))
      .map(relationship => ({
        label: getRelationshipLabel.value(relationship.uuid),
        value: relationship.uuid,
      })),
  ])

  /**
   * Returns relationships associated with a specific persona
   * @returns {(personaUuid: string) => Relationship[]} Function that takes a persona UUID and returns array of relationships
   */
  const getRelationshipsByPersona = computed(() => {
    return (personaUuid: string) => {
      const relationshipUuids = relationshipPersonas.value
        .filter(rp => rp.persona_uuid === personaUuid)
        .map(rp => rp.relationship_uuid)
      return relationships.value.filter(r => relationshipUuids.includes(r.uuid))
    }
  })

  // Actions
  /**
   * Fetches all relationships and their associated personas from the database if not already loaded
   * @throws {LMiXError} If the API request fails
   */
  async function selectRelationships(): Promise<void> {
    if (relationships.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('relationships')
        .select(`
          *,
          relationship_personas (*)
        `)
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      relationships.value = data.map(({ relationship_personas: _, ...relationship }) => relationship)
      relationshipPersonas.value = data.flatMap(r => r.relationship_personas || [])
    }
    catch (e) {
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Relationship selection failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a relationship and its associated personas in the database
   * @param {RelationshipInsert} relationship - The relationship data to upsert
   * @param {string[]} personaUuids - Array of persona UUIDs to associate with the relationship
   * @returns {Promise<string | null>} The UUID of the upserted relationship, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertRelationship(relationship: RelationshipInsert, personaUuids: string[]): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!relationship.uuid
    const original = {
      relationships: [...relationships.value],
      relationshipPersonas: [...relationshipPersonas.value]
    }

    try {
      const client = useSupabaseClient<Database>()

      // First upsert the relationship
      const { data: relationshipData, error: relationshipError } = await client
        .from('relationships')
        .upsert(relationship)
        .select()

      if (relationshipError) throw new LMiXError(
        relationshipError.message,
        'API_ERROR',
        relationshipError
      )

      if (!relationshipData?.[0]) return null

      const relationshipUuid = relationshipData[0].uuid

      // Then handle the personas
      if (isUpdate) {
        // Delete existing relationships
        const { error: deleteError } = await client
          .from('relationship_personas')
          .delete()
          .eq('relationship_uuid', relationshipUuid)

        if (deleteError) throw new LMiXError(
          deleteError.message,
          'API_ERROR',
          deleteError
        )
      }

      // Insert new relationships
      if (personaUuids.length > 0) {
        const { data: personasData, error: insertError } = await client
          .from('relationship_personas')
          .insert(personaUuids.map(personaUuid => ({
            relationship_uuid: relationshipUuid,
            persona_uuid: personaUuid,
            user_uuid: relationship.user_uuid,
          })))
          .select()

        if (insertError) throw new LMiXError(
          insertError.message,
          'API_ERROR',
          insertError
        )

        relationshipPersonas.value = personasData
      }

      if (isUpdate) {
        const index = relationships.value.findIndex(r => r.uuid === relationshipUuid)
        if (index !== -1) {
          relationships.value[index] = relationshipData[0]
        }
      }
      else {
        relationships.value.unshift(relationshipData[0])
      }

      return relationshipUuid
    }
    catch (e) {
      relationships.value = original.relationships
      relationshipPersonas.value = original.relationshipPersonas
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Relationship upsert failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a relationship and its associated personas from the database
   * @param {string} uuid - UUID of the relationship to delete
   * @throws {LMiXError} If the API request fails
   */
  async function deleteRelationship(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = {
      relationships: [...relationships.value],
      relationshipPersonas: [...relationshipPersonas.value]
    }

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('relationships')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      relationships.value = relationships.value.filter(r => r.uuid !== uuid)
      relationshipPersonas.value = relationshipPersonas.value.filter(rp => rp.relationship_uuid !== uuid)
    }
    catch (e) {
      relationships.value = original.relationships
      relationshipPersonas.value = original.relationshipPersonas
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Relationship deletion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Removes a persona from a relationship in the database
   * @param {string} relationshipUuid - UUID of the relationship
   * @param {string} personaUuid - UUID of the persona to remove
   * @throws {LMiXError} If the API request fails
   */
  async function removePersonaFromRelationship(relationshipUuid: string, personaUuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...relationshipPersonas.value]

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('relationship_personas')
        .delete()
        .match({
          relationship_uuid: relationshipUuid,
          persona_uuid: personaUuid
        })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      relationshipPersonas.value = relationshipPersonas.value.filter(
        rp => !(rp.relationship_uuid === relationshipUuid && rp.persona_uuid === personaUuid)
      )
    }
    catch (e) {
      relationshipPersonas.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Remove persona from relationship failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    relationships,
    relationshipPersonas,
    loading,
    error,
    // Getters
    getRelationship,
    getRelationshipPersonas,
    getRelationshipLabel,
    getRelationshipNavigation,
    getRelationshipOptions,
    getRelationshipsByPersona,
    // Actions
    selectRelationships,
    upsertRelationship,
    deleteRelationship,
    removePersonaFromRelationship,
  }
})