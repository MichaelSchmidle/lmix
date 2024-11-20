<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const colorMode = useColorMode()

// Determine if a mode is active
const isActive = (mode: string) => colorMode.value === mode

// Set the color mode
const setMode = (mode: 'dark' | 'light') => {
  colorMode.preference = mode
}
</script>

<template>
  <div class="flex gap-[1ex]">
    <UTooltip :text="t('light')">
      <UButton color="gray" icon="i-ph-sun-fill" size="xs" :variant="isActive('light') ? 'solid' : 'ghost'" @click="setMode('light')" />
    </UTooltip>
    <UTooltip :text="t('dark')">
      <UButton color="gray" icon="i-ph-moon-fill" size="xs" :variant="isActive('dark') ? 'solid' : 'ghost'" @click="setMode('dark')" />
    </UTooltip>
  </div>
</template>

<i18n lang="yaml">
en:
  light: Light mode
  dark: Dark mode
</i18n>
