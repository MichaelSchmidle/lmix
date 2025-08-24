<template>
  <IndexPanel
    route-name="assistants"
    :title="title"
  >
    <AssistantsCreateLink size="lg" />
    <Assistants />
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
  title: Assistants
</i18n>
