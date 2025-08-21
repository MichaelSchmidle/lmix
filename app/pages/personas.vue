<template>
  <IndexPanel
    base-route="personas"
    :title="title"
  >
    <PersonasCreateButton size="lg" />
    <Personas />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('personas')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  personas: Personas
</i18n>
