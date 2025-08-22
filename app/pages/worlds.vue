<template>
  <IndexPanel
    base-route="worlds"
    :title="title"
  >
    <WorldsCreateLink size="lg" />
    <Worlds />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('worlds')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  worlds: Worlds
</i18n>
