<template>
  <IndexPanel
    route-name="scenarios"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('scenarios-create')"
    />
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
  title: Scenarios
  label: Create Scenario
</i18n>
