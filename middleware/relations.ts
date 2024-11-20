export default defineNuxtRouteMiddleware(async () => {
  const relationStore = useRelationStore()
  const personaStore = usePersonaStore()
  await Promise.all([
    relationStore.selectRelations(),
    personaStore.selectPersonas(),
  ])
}) 