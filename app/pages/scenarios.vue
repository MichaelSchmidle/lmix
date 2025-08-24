<template>
  <IndexPanel
    route-name="scenarios"
    :title="title"
  >
    <ScenariosCreateLink size="lg" />
    <Scenarios />
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
  title: Scenarios
</i18n>
