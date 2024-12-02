export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const relationStore = useRelationStore()
  const personaStore = usePersonaStore()
  await Promise.all([
    relationStore.selectRelations(),
    personaStore.selectPersonas(),
  ])
}) 