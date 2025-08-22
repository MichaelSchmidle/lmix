<template>
  <IndexPanel
    route="worlds"
    :title="title"
  >
    <WorldsCreateLink size="lg" />
    <Worlds />
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
  title: Worlds
</i18n>
