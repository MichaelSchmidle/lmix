export default defineNuxtRouteMiddleware(async () => {
  const relationshipStore = useRelationshipStore()
  const personaStore = usePersonaStore()
  await Promise.all([
    relationshipStore.selectRelationships(),
    personaStore.selectPersonas(),
  ])
}) 