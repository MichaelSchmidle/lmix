<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'worlds',
  ],
})
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[calc(100vw-64px)] sm:max-w-[200px]',
    route.path !== '/worlds' && 'hidden lg:flex',
  ]">
    <WorldsPanel />
  </UiPanel>
  <NuxtPage v-if="route.path !== '/worlds'" />
  <UiPanel v-else class="flex-1">
    <UiPanelHeader class="justify-end">
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Worlds
</i18n>