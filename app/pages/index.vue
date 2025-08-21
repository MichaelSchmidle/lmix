<template>
  <UDashboardPanel>
    <UDashboardNavbar
      :title="title"
      toggle-side="right"
    />
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()
const title = t('create')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  create: Create Production
</i18n>
