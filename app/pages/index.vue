<template>
  <PagePanel
    route-name="index"
    :title="title"
  />
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
  title: Create Production
</i18n>
