export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const assistantStore = useAssistantStore()
  await assistantStore.selectAssistants()
})