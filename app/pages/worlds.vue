<template>
  <IndexPanel
    route-name="worlds"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('worlds-create')"
    />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocaleRoute()
const title = t('title')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Worlds
  label: Create World
</i18n>
