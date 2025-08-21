<template>
  <div>
    <IndexPanel
      base-route="worlds"
      :title="title"
    >
      <WorldsCreateButton size="lg" />
      <Worlds />
    </IndexPanel>
    <NuxtPage />
  </div>
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
