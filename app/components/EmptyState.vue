<template>
  <UAlert
    color="neutral"
    icon="i-ph-empty"
    variant="soft"
    :description="t('description')"
  />
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
</script>

<i18n lang="yaml">
en:
  description: No data yet.
</i18n>
