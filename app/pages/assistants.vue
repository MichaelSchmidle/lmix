<template>
  <IndexPanel
    base-route="assistants"
    :title="title"
  >
    <AssistantsCreateButton size="lg" />
    <Assistants />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('assistants')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  assistants: Assistants
</i18n>
