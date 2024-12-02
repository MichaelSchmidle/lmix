<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <UTooltip :text="t('home')">
    <UButton to="/" variant="link">
      <Logotype class="h-4 text-primary hover:text-primary-600 dark:hover:text-primary-500 w-auto" />
    </UButton>
  </UTooltip>
</template>

<i18n lang="yaml">
en:
  home: Home
</i18n>
