<template>
  <IndexPanel
    route="affiliations"
    :title="title"
  >
    <AffiliationsCreateLink size="lg" />
    <Affiliations />
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
  title: Affiliations
</i18n>
