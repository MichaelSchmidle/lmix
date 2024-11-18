export default defineNuxtRouteMiddleware(async () => {
  const scenarioStore = useScenarioStore()
  await scenarioStore.selectScenarios()
}) 