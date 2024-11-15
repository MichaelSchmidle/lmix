<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

const isOpen = ref(false)
</script>

<template>
  <div>
    <UTooltip :text="t('navigation')">
      <UButton color="gray" icon="i-ph-list" variant="ghost" @click="isOpen = true" />
    </UTooltip>
    <USlideover v-model="isOpen" :ui="{ background: 'bg-gray-100 dark:bg-gray-900', base: 'divide-y divide-gray-200 dark:divide-gray-800', width: 'max-w-[360px]' }">
      <NavPanel is-slideover @close="isOpen = false" />
    </USlideover>
  </div>
</template>

<i18n lang="yaml">
  en:
    navigation: Show Navigation
</i18n>
