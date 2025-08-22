<template>
  <IndexPanel
    route="personas"
    :title="title"
  >
    <PersonasCreateLink size="lg" />
    <Personas />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Personas
</i18n>
