<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'assistants',
  ],
})
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[calc(100vw-64px)] sm:max-w-[200px]',
    route.path !== '/assistants' && 'hidden lg:flex',
  ]">
    <AssistantsPanel />
  </UiPanel>
  <NuxtPage v-if="route.path !== '/assistants'" />
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
  title: Assistants
</i18n>