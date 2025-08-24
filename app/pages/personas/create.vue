<template>
  <PagePanel
    route-name="personas-create"
    :title="title"
  >
    <PersonasUpsert />
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
  title: Create Persona
</i18n>
