export default defineNuxtRouteMiddleware(async () => {
  const productionStore = useProductionStore()
  await productionStore.selectProductions()
}) 