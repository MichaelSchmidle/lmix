<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const appConfig = useAppConfig()
const colorMode = useColorMode()

// Get the correct shade based on color mode
const colorShade = computed(() => colorMode.value === 'dark' ? '400' : '500')

const setTheme = (color: 'cyan' | 'indigo') => {
  appConfig.ui.primary = color
  // Use useCookie instead of localStorage for consistency with color mode
  const themeCookie = useCookie('nuxt-ui-primary')
  themeCookie.value = color
}

// Initialize theme from cookie on load
onMounted(() => {
  const themeCookie = useCookie('nuxt-ui-primary')
  if (themeCookie.value) {
    appConfig.ui.primary = themeCookie.value as 'cyan' | 'indigo'
  }
})

// Determine if a theme is active
const isActive = (color: string) => appConfig.ui.primary === color
</script>

<template>
  <div class="flex gap-1">
    <UTooltip :text="t('indigo')">
      <UButton color="gray" size="sm" square :variant="isActive('indigo') ? 'solid' : 'ghost'" @click="setTheme('indigo')">
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
      </UButton>
    </UTooltip>

    <UTooltip :text="t('cyan')">
      <UButton color="white" size="sm" square :variant="isActive('cyan') ? 'solid' : 'ghost'" @click="setTheme('cyan')">
        <span class="inline-block w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
      </UButton>
    </UTooltip>
  </div>
</template>

<i18n lang="yaml">
en:
  cyan: Cyan theme
  indigo: Indigo theme
</i18n>