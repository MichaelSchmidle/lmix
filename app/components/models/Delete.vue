<template>
  <UButton
    color="neutral"
    icon="i-ph-trash-fill"
    :label="t('delete')"
    size="sm"
    variant="ghost"
  />
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<i18n lang="yaml">
en:
  delete: Delete
</i18n>
