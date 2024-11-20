export default defineNuxtRouteMiddleware(async () => {
  const personaStore = usePersonaStore()
  await personaStore.selectPersonas()
})
