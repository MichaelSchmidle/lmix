<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const appConfig = useAppConfig()

const setTheme = (color: 'cyan' | 'indigo') => {
  // Set primary color
  appConfig.ui.primary = color
  // Set corresponding gray scale
  appConfig.ui.gray = color === 'cyan' ? 'slate' : 'stone'

  // Set CSS variables for black/white
  document.documentElement.style.setProperty(
    '--color-white',
    color === 'cyan' ? '#e5e7e8' : '#e7e6e7'
  )
  document.documentElement.style.setProperty(
    '--color-black',
    color === 'cyan' ? '#181919' : '#19181b'
  )

  // Store preference
  const themeCookie = useCookie('nuxt-ui-primary')
  themeCookie.value = color
}

// Initialize theme from cookie on load
onMounted(() => {
  const themeCookie = useCookie('nuxt-ui-primary')
  if (themeCookie.value) {
    setTheme(themeCookie.value as 'cyan' | 'indigo')
  }
})

// Determine if a theme is active
const isActive = (color: string) => appConfig.ui.primary === color
</script>

<template>
  <div class="flex gap-[1ex]">
    <UTooltip :text="t('indigo')">
      <UButton color="indigo" icon="i-ph-circle-fill" size="xs" :variant="isActive('indigo') ? 'solid' : 'ghost'" @click="setTheme('indigo')" />
    </UTooltip>
    <UTooltip :text="t('cyan')">
      <UButton color="cyan" icon="i-ph-circle-fill" size="xs" :variant="isActive('cyan') ? 'solid' : 'ghost'" @click="setTheme('cyan')" />
    </UTooltip>
  </div>
</template>

<i18n lang="yaml">
en:
  cyan: Cyan theme
  indigo: Indigo theme
</i18n>