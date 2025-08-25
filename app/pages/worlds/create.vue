<template>
  <PagePanel
    route-name="worlds-create"
    :title="title"
  >
    <WorldsUpsert @success="navigateTo(localeRoute('worlds'))" />
  </PagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const localeRoute = useLocaleRoute()
const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Create World
</i18n>
