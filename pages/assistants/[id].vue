<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const assistantStore = useAssistantStore()
const { getAssistant } = storeToRefs(assistantStore)
const assistant = getAssistant.value(route.params.id as string)

if (!assistant) {
  showError({
    statusCode: 404,
    message: t('assistantNotFound'),
  })
}

useHead({
  title: t('title', { name: assistant?.name }),
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
      <AssistantsUpsert :assistant="assistant" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: Assistant {name}
  assistantNotFound: Assistant not found
</i18n>