<template>
  <IndexPanel
    route-name="assistants"
    :title="title"
  >
    <AssistantsCreateLink size="lg" />
    <Assistants />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const assistantStore = useAssistantStore()
const title = t('title')

useHead({
  title,
})

// Fetch assistants on component mount
onMounted(async () => {
  if (!assistantStore.assistantsList.length) {
    await assistantStore.fetchAssistants()
  }
})
</script>

<i18n lang="yaml">
en:
  title: Assistants
</i18n>
