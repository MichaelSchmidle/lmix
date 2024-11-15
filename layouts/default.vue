<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-black text-black dark:text-white'
  },
})
</script>

<template>
  <UiPanelLayout>
    <UiPanel class="bg-gray-100 dark:bg-gray-900 hidden xl:flex max-w-[200px] min-w-[200px]">
      <NavPanel />
    </UiPanel>
    <NuxtPage />
  </UiPanelLayout>
</template>

<i18n lang="yaml">
  en:
</i18n>
