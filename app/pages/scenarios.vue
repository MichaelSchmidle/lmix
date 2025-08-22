<template>
  <IndexPanel
    base-route="scenarios"
    :title="title"
  >
    <ScenariosCreateLink size="lg" />
    <Scenarios />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('scenarios')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  scenarios: Scenarios
</i18n>
