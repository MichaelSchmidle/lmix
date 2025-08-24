<template>
  <IndexPanel
    route-name="models"
    :title="title"
  >
    <ModelsCreateLink size="lg" />

    <Models />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('title')
const modelStore = useModelStore()

useHead({
  title,
})

// Fetch models client-side after hydration
onMounted(async () => {
  await modelStore.fetchModels()
})
</script>

<i18n lang="yaml">
en:
  title: Models
</i18n>
