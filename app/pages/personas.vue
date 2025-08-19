<template>
  <DashboardPanel :title="title">
  </DashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()

const title = computed(() => t('personas'))
</script>

<i18n lang="yaml">
en:
  personas: 'Personas'
</i18n>