<template>
  <PagePanel
    route-name="affiliations-create"
    :title="title"
  />
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Create Affiliations
</i18n>
