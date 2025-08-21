<template>
  <IndexPanel
    base-route="affiliations"
    :title="title"
  >
    <AffiliationsCreateButton size="lg" />
    <Affiliations />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('affiliations')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  affiliations: Affiliations
</i18n>
