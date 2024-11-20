export default defineNuxtRouteMiddleware(async () => {
  const modelStore = useModelStore()
  await modelStore.selectModels()
}) 