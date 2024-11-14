<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

defineProps({
  hasBackButton: {
    type: Boolean,
    default: false,
  },
})

// Compute parent route by removing the last segment
const parentRoute = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  return '/' + pathSegments.slice(0, -1).join('/')
})
</script>

<template>
  <div class="flex items-center justify-between min-h-16 px-4 py-3">
    <UTooltip v-if="hasBackButton" class="block lg:hidden" :text="t('up')">
      <UButton color="gray" icon="i-ph-arrow-up" :to="parentRoute" variant="ghost" />
    </UTooltip>
    <div class="font-bold truncate">
      <slot />
    </div>
    <slot name="toggle" />
  </div>
</template>

<i18n lang="yaml">
  en:
    up: Up to parent page
</i18n>
