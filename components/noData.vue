<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

defineProps({
  message: {
    type: String,
  },
})
</script>

<template>
  <div class="prose prose-sm max-w-none dark:prose-invert opacity-25 py-6 text-center">
    <p>
      <UIcon name="i-ph-placeholder-thin" class="h-8 w-8" />
    </p>
    <slot name="message">
      <p>{{ message || t('noData') }}</p>
    </slot>
  </div>
</template>

<i18n lang="yaml">
en:
  noData: No data
</i18n>
