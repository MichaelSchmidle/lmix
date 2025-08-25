<template>
  <IndexPanel
    route-name="affiliations"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('affiliations-create')"
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
  title: Affiliations
  label: Create Affiliation
</i18n>
