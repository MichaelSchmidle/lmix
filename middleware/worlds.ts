export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return
  const worldStore = useWorldStore()
  await worldStore.selectWorlds()
}) 