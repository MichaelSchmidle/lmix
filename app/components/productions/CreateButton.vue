<template>
  <UButton
    v-bind="props"
    icon="i-ph-plus"
    :label="t('create')"
    :to="localeRoute('/')"
  />
</template>

<script setup lang="ts">
import type { ButtonProps } from '#ui/types'
const { t } = useI18n({ useScope: 'local' })
const localeRoute = useLocaleRoute()

const props = withDefaults(
  defineProps<{
    block?: ButtonProps['block']
    color?: ButtonProps['color']
    size?: ButtonProps['size']
    variant?: ButtonProps['variant']
  }>(),
  {
    block: true,
    color: 'primary',
    size: 'md',
    variant: 'solid',
  }
)
</script>

<i18n lang="yaml">
en:
  create: Create Production
</i18n>
