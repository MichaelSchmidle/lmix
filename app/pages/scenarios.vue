<template>
  <DashboardPanel :title="title">
  </DashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()

const title = computed(() => t('scenarios'))
</script>

<i18n lang="yaml">
en:
  scenarios: 'Scenarios'
</i18n>