<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const { theme, setTheme } = useColorTheme()

// Determine if a theme is active
const isActive = (color: string) => theme.value === color
</script>

<template>
  <div class="flex gap-[1ex]">
    <UTooltip :text="t('indigo')">
      <UButton color="gray" icon="i-ph-circle-fill" size="xs" :variant="isActive('indigo') ? 'solid' : 'ghost'" :ui="{
        color: {
          gray: {
            solid: 'text-indigo-500 dark:text-indigo-400',
            ghost: 'text-indigo-500 hover:text-indigo-500 dark:text-indigo-400 hover:dark:text-indigo-400'
          }
        }
      }" @click="setTheme('indigo')" />
    </UTooltip>
    <UTooltip :text="t('cyan')">
      <UButton color="gray" icon="i-ph-circle-fill" size="xs" :variant="isActive('cyan') ? 'solid' : 'ghost'" :ui="{
        color: {
          gray: {
            solid: 'text-cyan-500 dark:text-cyan-400',
            ghost: 'text-cyan-500 hover:text-cyan-500 dark:text-cyan-400 hover:dark:text-cyan-400'
          }
        }
      }" @click="setTheme('cyan')" />
    </UTooltip>
  </div>
</template>

<i18n lang="yaml">
en:
  cyan: Cyan theme
  indigo: Indigo theme
</i18n>