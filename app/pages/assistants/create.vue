<template>
  <PagePanel
    route-name="assistants-create"
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
  title: Create Assistants
</i18n>
