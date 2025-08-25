<template>
  <IndexPanel
    route-name="personas"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('personas-create')"
    />
    <Personas />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocaleRoute()
const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Personas
  label: Create Persona
</i18n>
