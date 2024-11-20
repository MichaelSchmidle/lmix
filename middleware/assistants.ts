export default defineNuxtRouteMiddleware(async () => {
  const assistantStore = useAssistantStore()
  await assistantStore.selectAssistants()
}) 