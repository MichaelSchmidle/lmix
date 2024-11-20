<script setup lang="ts">
import { twMerge } from 'tailwind-merge'

const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <div :class="twMerge('flex items-center justify-between min-h-16 px-4 py-3', $attrs.class as string)">
    <slot name="domainToggle" />
    <div class="font-bold truncate">
      <slot />
    </div>
    <slot name="mainToggle" />
  </div>
</template>

<i18n lang="yaml">
  en:
</i18n>
