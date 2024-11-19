<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'scenarios',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ t('title') }}
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <ScenariosUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Scenario
</i18n>