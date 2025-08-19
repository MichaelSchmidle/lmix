<template>
  <DashboardPanel :title="title">
  </DashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()

const title = computed(() => t('affiliations'))
</script>

<i18n lang="yaml">
en:
  affiliations: 'Affiliations'
</i18n>