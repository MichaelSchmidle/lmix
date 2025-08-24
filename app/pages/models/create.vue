<template>
  <PagePanel
    route-name="models-create"
    :title="title"
  >
    <ModelsInsert />
  </PagePanel>
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
  title: Create Models
</i18n>
