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
  <UTooltip :text="t('toggle')">
    <ClientOnly>
      <UToggle :aria-label="t('toggle')" on-icon="i-ph-moon-fill" off-icon="i-ph-sun-fill" v-model="isDarkMode" />
      <template #fallback>
        <UToggle :aria-label="t('toggle')" off-icon="i-ph-sun-fill" />
      </template>
    </ClientOnly>
  </UTooltip>
</template>

<i18n lang="yaml">
en:
  toggle: Toggle dark mode
</i18n>
