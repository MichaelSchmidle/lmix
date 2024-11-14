<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const colorMode = useColorMode()

// Computed property to bind to the toggle
const isDarkMode = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script>

<template>
  <ClientOnly>
    <UTooltip :text="t('toggle')">
      <UToggle :aria-label="t('toggle')" on-icon="i-ph-moon-fill" off-icon="i-ph-sun-fill" v-model="isDarkMode" />
    </UTooltip>
    <template #fallback>
      <UToggle :aria-label="t('toggle')" off-icon="i-ph-sun-fill" />
    </template>
  </ClientOnly>
</template>

<i18n lang="yaml">
en:
  toggle: Toggle dark mode
</i18n>
