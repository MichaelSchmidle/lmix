<template>
  <IndexPanel
    base-route="models"
    :title="title"
  >
    <ModelsCreateButton size="lg" />
    <Models />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('models')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  models: Models
</i18n>
