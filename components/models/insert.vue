<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <UiSection icon="i-ph-circuitry-thin" :title="t('title')" :description="t('description')">
    Test
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    title: Add Models
    description: Models are at the core of LMiX. They power your assistants.
</i18n>
