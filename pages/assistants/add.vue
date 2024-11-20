<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'personas',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <AssistantsPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <AssistantsUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Assistant
    assistants: Assistant Navigation
</i18n>