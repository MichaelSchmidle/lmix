<template>
  <DashboardPanel :title="title">
  </DashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()

const title = computed(() => t('models'))
</script>

<i18n lang="yaml">
en:
  models: 'Models'
</i18n>