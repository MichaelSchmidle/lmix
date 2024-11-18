export default defineNuxtRouteMiddleware(async () => {
  const worldStore = useWorldStore()
  await worldStore.selectWorlds()
}) 