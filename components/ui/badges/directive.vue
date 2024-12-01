<script setup lang="ts">
import type { BadgeColor } from '#ui/types'

const { t } = useI18n({ useScope: 'local' })

const props = defineProps({
  color: {
    default: 'cyan',
    type: String as PropType<BadgeColor>,
  },
})
</script>

<template>
  <UTooltip class="cursor-help" :text="t('directive.tooltip')">
    <UBadge :color="color" :label="t('directive.label')" size="xs" variant="soft" :ui="{ rounded: 'rounded-full' }" />
  </UTooltip>
</template>

<i18n lang="yaml">
en:
  directive:
    label: Directive
    tooltip: Instructions for the immediately following turn.
</i18n>
