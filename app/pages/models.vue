<template>
  <IndexPanel
    route-name="models"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('models-create')"
    />

    <Models />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocaleRoute()
const title = t('title')
const modelStore = useModelStore()

useHead({
  title,
})

// Fetch models client-side after hydration
onMounted(async () => {
  if (!modelStore.models.length && !modelStore.loading) {
    await modelStore.fetchModels()
  }
})
</script>

<i18n lang="yaml">
en:
  title: Models
  label: Create Models
</i18n>
