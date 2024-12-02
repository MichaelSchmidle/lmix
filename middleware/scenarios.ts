export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const scenarioStore = useScenarioStore()
  await scenarioStore.selectScenarios()
}) 