<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <div class="space-y-6">
    <UDivider>{{ t('title') }}</UDivider>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
      <UButton block icon="simple-icons:discord" label="Discord" size="xl" variant="soft" />
      <UButton block icon="simple-icons:github" label="GitHub" size="xl" variant="soft" />
      <UButton block icon="simple-icons:google" label="Google" size="xl" variant="soft" />
      <UButton block icon="simple-icons:reddit" label="Reddit" size="xl" variant="soft" />
    </div>
  </div>
</template>

<i18n lang="yaml">
  en:
    title: Continue With
</i18n>
