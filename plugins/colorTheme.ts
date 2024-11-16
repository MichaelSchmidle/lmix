export default defineNuxtPlugin(() => {
  const { initTheme } = useColorTheme()

  // Initialize theme as early as possible
  initTheme()
}) 