export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const modelStore = useModelStore()
  await modelStore.selectModels()
}) 