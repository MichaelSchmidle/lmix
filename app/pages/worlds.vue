<template>
  <DashboardPanel :title="title">
  </DashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()

const title = computed(() => t('worlds'))
</script>

<i18n lang="yaml">
en:
  worlds: 'Worlds'
</i18n>