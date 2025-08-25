<template>
  <IndexPanel
    route-name="assistants"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('assistants-create')"
    />
    <Assistants />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocaleRoute()
const assistantStore = useAssistantStore()
const title = t('title')

useHead({
  title,
})

// Fetch assistants on component mount
onMounted(async () => {
  if (!assistantStore.assistants.length) {
    await assistantStore.fetchAssistants()
  }
})
</script>

<i18n lang="yaml">
en:
  title: Assistants
  label: Create Assistant
</i18n>
