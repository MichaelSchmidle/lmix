export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const personaStore = usePersonaStore()
  await personaStore.selectPersonas()
})
